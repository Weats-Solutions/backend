// src/cloudflare/cloudflare.service.ts
import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import FormData from 'form-data';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CloudflareService {
    constructor(
        @Inject("ACCOUNT_ID") private readonly accountId: string,
        @Inject("API_TOKEN") private readonly apiToken: string,
        @Inject("BASE_URL") private readonly baseUrl: string,
        @Inject("DIRECT_UPLOAD_URL") private readonly directUploadUrl: string,
        private readonly httpService: HttpService,
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
            throw new InternalServerErrorException('Falha ao gerar URLs de upload.');
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
}
