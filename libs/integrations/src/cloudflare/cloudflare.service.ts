// src/cloudflare/cloudflare.service.ts
import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import FormData from 'form-data';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { ALLOWED_IMAGE_MIME_TYPES, ERRORS, MAX_FILE_SIZE_BYTES } from '@weats/common';
import path from 'path';
import { CorePrismaService, type Image } from '@weats/database';

@Injectable()
export class CloudflareService {
    constructor(
        @Inject("ACCOUNT_ID") private readonly accountId: string,
        @Inject("API_TOKEN") private readonly apiToken: string,
        @Inject("BASE_URL") private readonly baseUrl: string,
        @Inject("DIRECT_UPLOAD_URL") private readonly directUploadUrl: string,
        @Inject("CLOUDFLARE_CDN_URL") private readonly cdnUrl: string,
        private readonly httpService: HttpService,
        private readonly prismaService: CorePrismaService,
    ) { }

    async generateUploadUrls(count: number, establishmentId: string): Promise<{ id: string; uploadURL: string }[]> {
        const requests = Array.from({ length: count }).map(async () => {
            const form = new FormData();
            form.append('metadata', JSON.stringify({ establishmentId }));

            const response = await lastValueFrom(
                this.httpService.post(this.directUploadUrl, form, {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                        ...form.getHeaders(),
                    },
                })
            );

            const result = response.data.result;
            return {
                id: result.id, // Cloudflare generated ID
                uploadURL: result.uploadURL,
            };
        });

        try {
            return await Promise.all(requests);
        } catch (error) {
            console.error('Erro ao gerar Direct Upload URLs na Cloudflare:', error.response?.data || error);
            throw new RpcException({
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }


    async deleteImage(cloudflareImageId: string): Promise<void> {
        try {
            const response = await lastValueFrom(
                this.httpService.delete(`${this.baseUrl}/${cloudflareImageId}`, {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                    },
                }),
            );

            if (response.data.success) {
                return;
            }

            throw new InternalServerErrorException('Falha ao deletar a imagem.');
        } catch (error) {
            console.error('Erro ao fazer delete:', error.response?.data);
            throw new InternalServerErrorException('Falha ao deletar a imagem.');
        }
    }

    private validateFileSize(buffer: Buffer): void {
        if (buffer.length > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException(
                `Arquivo muito grande. Tamanho máximo permitido: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
            );
        }
    }

    private validateMimeType(mimeType: string, filename: string) {
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
            throw new BadRequestException(
                `Tipo de ficheiro não suportado (${mimeType}). Permitidos: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
            );
        }
        // Extra safeguard: basic extension check (optional)
        const ext = path.extname(filename).toLowerCase();
        const extMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
        };
        if (ext && extMap[ext] && extMap[ext] !== mimeType) {
            // Mismatch between reported mimetype and extension
            throw new BadRequestException(
                `Extensão (${ext}) não corresponde ao mimeType (${mimeType}).`,
            );
        }
    }

    async uploadImage(
        image: {
            fileName: string;
            mimetype: string;
            buffer: Buffer;
        },
        establishmentId: string,
    ): Promise<Image> {
        this.validateFileSize(image.buffer);

        const ext = path.extname(image.fileName).toLowerCase();
        if (!image.mimetype) {
            const extMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.heic': 'image/heic',
                '.heif': 'image/heif',
            };
            image.mimetype = extMap[ext] || 'application/octet-stream';
        }

        this.validateMimeType(image.mimetype, image.fileName);

        const form = new FormData();
        form.append('file', image.buffer, {
            filename: image.fileName,
            contentType: image.mimetype,
        });
        form.append('metadata', JSON.stringify({ establishmentId }));
        form.append('requireSignedURLs', 'false');

        try {
            const response = await lastValueFrom(
                this.httpService.post(this.baseUrl, form, {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                        ...form.getHeaders(),
                    },
                }),
            );

            const fileName = response.data.result.filename;

            if (response.data.success) {
                try {
                    const createdImage = await this.prismaService.image.create({
                        data: {
                            fileName: fileName,
                            cloudflareImageId: response.data.result.id,
                            url: `${this.cdnUrl}/${response.data.result.id}`,
                            establishmentId,
                            fileSize: image.buffer.length,
                            metadata: {},
                        },
                    });

                    return createdImage;
                } catch (error) {
                    console.error('Erro ao guardar imagem na base de dados:', error);
                    throw new InternalServerErrorException('Falha no upload da imagem.');
                }
            }

            throw new InternalServerErrorException('Falha no upload da imagem.');
        } catch (error) {
            console.error('Erro ao fazer upload:', error.response?.data || error);
            throw new InternalServerErrorException('Falha no upload da imagem.');
        }
    }

}
