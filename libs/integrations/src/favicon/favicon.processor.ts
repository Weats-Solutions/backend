import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { FaviconService } from './favicon.service';
import { CorePrismaService } from '@weats/database';
import { CloudflareR2Service } from '../cloudflare/cloudflare-r2.service';
import { QUEUES } from '@weats/bull/queues/queues.constants';

@Processor(QUEUES.IMAGE)
export class FaviconProcessor {
    constructor(
        private readonly faviconService: FaviconService,
        private readonly corePrismaService: CorePrismaService,
        private readonly r2Service: CloudflareR2Service,
    ) { }

    @Process('generate-favicons')
    async handleGenerateFavicons(job: Job<{ source: string, establishmentId: string }>) {
        const { source, establishmentId } = job.data;
        const buffer = Buffer.from(source, 'base64');

        // 1. Gerar as imagens na memória
        const response = await this.faviconService.generateRawFavicons(buffer);
        const wanted = ['favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'];
        const imagesToUpload = response.images.filter(img => wanted.includes(img.name));

        const newImageIds: { role: string, id: string, cloudflareId: string }[] = [];

        // 2. Upload para Cloudflare (fora da transação de BD)
        for (let i = 0; i < imagesToUpload.length; i++) {
            const img = imagesToUpload[i];
            const uploaded = await this.faviconService.uploadToCloudflare(img.contents, img.name, establishmentId);

            newImageIds.push({
                role: img.name,
                id: uploaded.id,
                cloudflareId: uploaded.cloudflareImageId
            });

            await job.progress(Math.floor(((i + 1) / imagesToUpload.length) * 80)); // 80% do progresso é upload
        }

        // 3. TRANSACTION: Troca atómica na Base de Dados
        try {
            await this.corePrismaService.$transaction(async (tx) => {
                // A. Buscar assets antigos para saber o que apagar depois
                const oldAssets = await tx.faviconAsset.findMany({
                    where: { establishmentId },
                    include: { image: true }
                });

                // B. Remover os vínculos antigos
                await tx.faviconAsset.deleteMany({
                    where: { establishmentId }
                });

                // C. Criar os novos vínculos
                await tx.faviconAsset.createMany({
                    data: newImageIds.map(img => ({
                        establishmentId,
                        role: img.role,
                        imageId: img.id
                    }))
                });

                // Retornamos os IDs antigos para limpar a Cloudflare depois do commit
                return oldAssets.map(a => a.image.cloudflareImageId);
            }).then(async (oldCloudflareIds) => {
                // 4. Limpeza (Cleanup): Apagar imagens órfãs da Cloudflare
                // Fazemos isto DEPOIS da transação ter sucesso
                for (const cfId of oldCloudflareIds) {
                    await this.r2Service.deleteImage(cfId);
                }
            });

            await job.progress(100);
            return { success: true };

        } catch (error) {
            // Se a transação falhar, devemos idealmente apagar as imagens que acabámos de subir para a Cloudflare
            for (const img of newImageIds) {
                await this.r2Service.deleteImage(img.cloudflareId);
            }
            throw new Error('Falha ao atualizar favicons na base de dados');
        }
    }
}