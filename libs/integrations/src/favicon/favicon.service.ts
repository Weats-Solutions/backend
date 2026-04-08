import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import favicons, { FaviconResponse } from 'favicons';
import { RpcException } from '@nestjs/microservices';
import { CloudflareService } from "@weats/integrations/cloudflare/cloudflare.service";
import path from 'path';

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
        @InjectQueue('jobs') private readonly jobsQueue: Queue,
        private readonly cloudflareService: CloudflareService,
    ) { }

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
        };

        return await this.cloudflareService.uploadImage(
            {
                fileName: filename,
                buffer: content,
                mimetype: extMap[ext] || 'image/png', // Default para png se falhar
            },
            establishmentId
        );
    }

    async enqueueFaviconJob(source: Buffer, establishmentId: string) {
        const job = await this.jobsQueue.add('generate-favicons', {
            source: source.toString('base64'),
            establishmentId
        });
        return { jobId: job.id };
    }
}