import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { ImageService } from './image.service';
import { CloudflareService } from '@weats/integrations/cloudflare/cloudflare.service';
import { CloudflareR2Service } from '@weats/integrations/cloudflare/cloudflare-r2.service';
import { Controller } from '@nestjs/common';


@Controller()
export class ImageController {
    constructor(
        private readonly imageService: ImageService,
        private readonly cloudflareService: CloudflareService,
        private readonly cloudflareR2Service: CloudflareR2Service,
    ) { }


    @MessagePattern(DASHBOARD_PATTERNS.IMAGE_GET_BY_ESTABLISHMENT)
    findImagesByEstablishment(
        @Payload() payload: { establishmentId: string, cursor?: string, limit?: number, search?: string },
    ) {
        const parsedLimit = Number(payload.limit);
        const take = Number.isInteger(parsedLimit)
            ? Math.min(100, Math.max(1, parsedLimit))
            : 18;

        return this.imageService.findImagesByEstablishment(payload.establishmentId, {
            cursor: payload.cursor,
            limit: take,
            search: payload.search,
        });
    }


    @MessagePattern(DASHBOARD_PATTERNS.IMAGE_UPDATE)
    async updateImageName(
        @Payload() payload: { id: string, establishmentId: string, fileName: string },
    ) {
        return this.imageService.updateImageName(
            payload.id,
            payload.establishmentId,
            payload.fileName,
        );
    }


    @MessagePattern(DASHBOARD_PATTERNS.IMAGE_DELETE)
    async deleteImages(
        @Payload() payload: { imageIds: string[], establishmentId: string },
    ) {
        return this.imageService.deleteImagesIfNotInUse(
            payload.imageIds,
            payload.establishmentId,
        );
    }


    @MessagePattern(DASHBOARD_PATTERNS.IMAGE_GENERATE_UPLOAD_URLS)
    async generateDirectUploadUrls(
        @Payload() payload: { count: number, establishmentId: string },
    ) {
        const urls = await this.cloudflareService.generateUploadUrls(
            payload.count,
            payload.establishmentId,
        );

        return { urls };
    }

    @MessagePattern(DASHBOARD_PATTERNS.IMAGE_GENERATE_R2_UPLOAD_URLS)
    async generateR2DirectUploadUrls(
        @Payload() payload: { count: number, establishmentId: string },
    ) {
        const urls = await this.cloudflareR2Service.generateUploadUrls(
            payload.count,
            payload.establishmentId,
        );
        return { urls };
    }

    @MessagePattern(DASHBOARD_PATTERNS.IMAGE_CONFIRM_UPLOAD)
    async confirmDirectUploads(
        @Payload() payload: { images: { id: string, fileName: string, fileSize: number }[], establishmentId: string },
    ) {
        return this.imageService.confirmDirectUploads(
            payload.images,
            payload.establishmentId,
        );
    }
}
