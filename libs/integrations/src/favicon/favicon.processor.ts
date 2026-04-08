import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { FaviconService } from './favicon.service';

@Processor('jobs')
export class FaviconProcessor {
    constructor(private readonly faviconService: FaviconService) { }

    @Process('generate-favicons')
    async handleGenerateFavicons(job: Job<{ source: string, establishmentId: string }>) {
        const { source, establishmentId } = job.data;
        const buffer = Buffer.from(source, 'base64');

        const response = await this.faviconService.generateRawFavicons(buffer);

        const wanted = [
            'favicon-16x16.png',
            'favicon-32x32.png',
            'apple-touch-icon.png',
            'android-chrome-192x192.png',
            'android-chrome-512x512.png',
        ];

        const icons: Record<string, string> = {};
        const imagesToUpload = response.images.filter(img => wanted.includes(img.name));

        for (let i = 0; i < imagesToUpload.length; i++) {
            const img = imagesToUpload[i];

            // Aqui chamamos o service que por sua vez chama o seu uploadImage
            const uploadedImage = await this.faviconService.uploadToCloudflare(
                img.contents,
                img.name,
                establishmentId
            );

            // Guardamos a URL que veio da base de dados/Cloudflare
            icons[img.name] = uploadedImage.url;

            await job.progress(Math.floor(((i + 1) / imagesToUpload.length) * 100));
        }

        return {
            establishmentId,
            icons,
            html: {
                favicon32: icons['favicon-32x32.png'],
                favicon16: icons['favicon-16x16.png'],
                appleTouch: icons['apple-touch-icon.png'],
                android192: icons['android-chrome-192x192.png'],
                android512: icons['android-chrome-512x512.png'],
            },
        };
    }
}