import {
    Inject,
    Injectable
} from '@nestjs/common';
import {
    S3Client,
    DeleteObjectCommand,
    PutObjectCommand,
    GetObjectCommand,
    CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class CloudflareR2Service {
    private s3Client: S3Client;

    constructor(
        @Inject("R2_IMAGES_BUCKET_ACCESS_KEY") private readonly accessKey: string,
        @Inject("R2_IMAGES_BUCKET_SECRET_KEY") private readonly secretKey: string,
        @Inject("R2_IMAGES_BUCKET_NAME") private readonly bucketName: string,
        @Inject("R2_IMAGES_BUCKET_S3_ENDPOINT") private readonly s3Endpoint: string,
        @Inject("R2_CDN_URL") private readonly cdnUrl: string,
    ) {
        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: this.s3Endpoint,
            credentials: {
                accessKeyId: this.accessKey,
                secretAccessKey: this.secretKey,
            },
            // Desativa checksums extra que podem causar problemas de preflight no browser
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        });
    }

    /**
     * Gera Presigned URLs (PUT) para upload direto do cliente para o R2
     */
    async generateUploadUrls(count: number, establishmentId: string) {
        try {
            const requests = Array.from({ length: count }).map(async () => {
                const fileId = crypto.randomUUID();
                const key = `establishments/${establishmentId}/${fileId}`;

                const command = new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                    CacheControl: "public, max-age=31536000, immutable",
                });

                // URL válida por 1 hora (3600 segundos)
                const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

                return {
                    id: key,
                    uploadURL: url,
                };
            });

            return await Promise.all(requests);
        } catch (error) {
            console.error('Erro ao gerar R2 Presigned PUT URL:', error);
            throw new RpcException({ message: ERRORS.BAD_REQUEST, code: ERRORS.BAD_REQUEST });
        }
    }

    async deleteImage(key: string) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            await this.s3Client.send(command);
        } catch (error) {
            console.error(`Não foi possível apagar a imagem ${key} do R2`);
        }
    }

    /**
     * Faz upload direto de um buffer para o R2 (usado pelo backend para favicons, etc)
     */
    async uploadFile(content: Buffer, filename: string, establishmentId: string, mimetype: string) {
        try {
            const fileId = crypto.randomUUID();
            const ext = path.extname(filename);
            const key = `establishments/${establishmentId}/favicons/${fileId}${ext}`;

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: content,
                ContentType: mimetype,
                CacheControl: "public, max-age=31536000, immutable",
            });

            await this.s3Client.send(command);

            return {
                id: key,
                url: `${this.cdnUrl}/${key}`
            };
        } catch (error) {
            console.error('Erro ao fazer upload direto para R2:', error);
            throw new RpcException({ message: 'Falha ao guardar ficheiro no R2' });
        }
    }

    async getFileDataUri(key: string) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);
            if (!response.Body) {
                throw new Error('R2 object body is empty');
            }

            const bytes = await response.Body.transformToByteArray();
            const base64 = Buffer.from(bytes).toString('base64');
            const contentType = response.ContentType || 'image/png';

            return `data:${contentType};base64,${base64}`;
        } catch (error) {
            console.error(`Erro ao obter ficheiro ${key} do R2:`, error);
            throw new RpcException({ message: 'Falha ao obter ficheiro do R2' });
        }
    }

    async copyImage(sourceKey: string, targetEstablishmentId: string) {
        try {
            const fileId = crypto.randomUUID();
            const ext = path.extname(sourceKey);
            const targetKey = `establishments/${targetEstablishmentId}/${fileId}${ext}`;

            const command = new CopyObjectCommand({
                Bucket: this.bucketName,
                CopySource: `${this.bucketName}/${sourceKey}`,
                Key: targetKey,
                CacheControl: "public, max-age=31536000, immutable",
            });

            await this.s3Client.send(command);

            return {
                id: targetKey,
                url: `${this.cdnUrl}/${targetKey}`,
            };
        } catch (error) {
            console.error(`Erro ao copiar imagem de ${sourceKey} para ${targetEstablishmentId}:`, error);
            throw new RpcException({ message: 'Falha ao duplicar ficheiro no R2' });
        }
    }
}
