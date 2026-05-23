import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import favicons, { FaviconResponse } from 'favicons';
import { RpcException } from '@nestjs/microservices';
import { CloudflareR2Service } from "@weats/integrations/cloudflare/cloudflare-r2.service";
import path from 'path';
import { ERRORS } from '@weats/common';
import { CorePrismaService } from '@weats/database';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { QUEUES } from '@weats/bull';

export interface FaviconResult {
    icons: Record<string, string>;
    html: {
        favicon32?: string;
        favicon16?: string;
        appleTouch?: string;
        android192?: string;
        android512?: string;
    };
}

@Injectable()
export class FaviconService {
    constructor(
        @InjectQueue(QUEUES.IMAGE) private readonly jobsQueue: Queue,
        private readonly r2Service: CloudflareR2Service,
        private readonly corePrismaService: CorePrismaService,
        private readonly httpService: HttpService,
    ) { }

    async getJobStatus(jobId: string) {
        const job = await this.jobsQueue.getJob(jobId);

        if (!job) {
            throw new RpcException({
                code: 404,
                message: ERRORS.JOB_NOT_FOUND,
            });
        }

        const state = await job.getState(); // 'completed', 'failed', 'delayed', 'active', 'waiting'
        const progress = job.progress(); // O valor 0-100 que definimos no Processor
        const result = job.returnvalue; // O objeto final retornado pelo Processor
        const reason = job.failedReason; // Se falhou, diz porquê

        return {
            id: job.id,
            state,
            progress,
            result: state === 'completed' ? result : null,
            error: state === 'failed' ? reason : null,
        };
    }

    async processFaviconFromImageId(imageId: string, establishmentId: string) {
        // 1. Procurar a imagem na DB
        const image = await this.corePrismaService.image.findUnique({
            where: { id: imageId }
        });

        if (!image) throw new RpcException({
            code: 404,
            message: ERRORS.IMAGE_NOT_FOUND,
        });

        // 2. Determinar a URL de download correta
        // Se for R2 (detetado por metadados ou URL), não adicionamos /public
        const isR2 = (image.metadata as any)?.provider === 'r2' || image.url.includes('cdn.weats.app') || image.url.includes('r2.cloudflarestorage.com');
        const downloadUrl = isR2 ? image.url : `${image.url}/public`;

        try {
            const response = await lastValueFrom(
                this.httpService.get(downloadUrl, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Accept': 'image/*'
                    }
                })
            );

            const buffer = Buffer.from(response.data);

            // 3. Enviar para a fila
            return this.enqueueFaviconJob(buffer, establishmentId);

        } catch (error) {
            console.error('Erro ao descarregar imagem para favicon:', error.message, 'URL:', downloadUrl);
            throw new RpcException({
                code: 500,
                message: 'Não foi possível obter a imagem original para processar os favicons.',
            });
        }
    }
    async enqueueFaviconJob(source: Buffer, establishmentId: string) {
        const job = await this.jobsQueue.add('generate-favicons', {
            source: source.toString('base64'),
            establishmentId
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
            removeOnComplete: { age: 600 }, // 10 minutos
            removeOnFail: { age: 600 }, // 10 minutos
        });
        return { jobId: job.id };
    }

    // Gera os buffers das imagens
    async generateRawFavicons(source: Buffer | string): Promise<FaviconResponse> {
        const config = {
            path: '/',
            appName: 'App',
            appShortName: 'App',
            background: '#ffffff',
            theme_color: '#000000',
            icons: {
                favicons: true,
                appleIcon: true,
                android: true,
                windows: false,
                yandex: false,
                coast: false,
                firefox: false,
                appleStartup: false,
            },
        };

        try {
            return await favicons(source, config);
        } catch (error) {
            throw new RpcException('Favicon generation failed');
        }
    }

    async uploadToCloudflare(content: Buffer, filename: string, establishmentId: string) {
        // Mapeamento simples para garantir que o seu service aceite o mimetype
        const ext = path.extname(filename).toLowerCase();
        const extMap: Record<string, string> = {
            '.png': 'image/png',
            '.ico': 'image/x-icon',
            '.xml': 'application/xml',
            '.json': 'application/json',
            '.svg': 'image/svg+xml',
        };

        const mimetype = extMap[ext] || 'image/png';

        const uploaded = await this.r2Service.uploadFile(
            content,
            filename,
            establishmentId,
            mimetype
        );

        // Criar registo na Image table para manter compatibilidade com FaviconProcessor
        return await this.corePrismaService.image.create({
            data: {
                fileName: filename,
                cloudflareImageId: uploaded.id, // Guardamos a Key do R2 aqui
                url: uploaded.url,
                establishmentId,
                fileSize: content.length,
                metadata: { source: 'favicon_generator', provider: 'r2' },
            },
        });
    }


}