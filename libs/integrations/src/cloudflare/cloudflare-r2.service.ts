import {
    Inject,
    Injectable
} from '@nestjs/common';
import {
    S3Client,
    DeleteObjectCommand,
    PutObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import * as crypto from 'crypto';

@Injectable()
export class CloudflareR2Service {
    private s3Client: S3Client;

    constructor(
        @Inject("R2_IMAGES_BUCKET_ACCESS_KEY") private readonly accessKey: string,
        @Inject("R2_IMAGES_BUCKET_SECRET_KEY") private readonly secretKey: string,
        @Inject("R2_IMAGES_BUCKET_NAME") private readonly bucketName: string,
        @Inject("R2_IMAGES_BUCKET_S3_ENDPOINT") private readonly s3Endpoint: string,
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
}