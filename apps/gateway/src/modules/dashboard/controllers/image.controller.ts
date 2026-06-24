import {
    Body,
    Controller,
    Get,
    Post,
    Patch,
    Param,
    UseGuards,
    Query,
    Inject,
} from '@nestjs/common';
import { FEATURE_KEY } from '@weats/common/constants';
import { FeatureLimitGuard } from '@weats/common/guards/feature-limit.guard';
import { feature } from '@weats/types';
import { CurrentEstablishment } from '@weats/common/decorators/current-establishment.decorator';
import { Roles } from '@weats/common/decorators/roles.decorator';
import { ClerkGuard } from '@weats/common/guards/clerk.guard';
import { EstablishmentStaffGuard } from '@weats/common/guards/establishment-staff.guard';
import { Establishment } from '@weats/types/establishment';
import { GenerateUploadUrlsDto } from '@weats/contracts/dashboard/dtos/image/upload-urls.dto';
import { ConfirmUploadsDto } from '@weats/contracts/dashboard/dtos/image/confirm-upload.dto';
import { UpdateImageDto } from '@weats/contracts/dashboard/dtos/image/update-image.dto';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE, RequiresFeature, RateLimit } from '@weats/common';



@Controller('images')
export class ImageController {
    constructor(
        @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    ) { }

    @Roles()
    @Get()
    @RateLimit('RELAXED') // 120 req/min — listagem de imagens
    findImagesByEstablishment(
        @CurrentEstablishment() establishment: Establishment,
        @Query('cursor') cursor?: string,
        @Query('limit') limit = '5',
        @Query('search') search?: string,
    ) {
        const parsedLimit = Number(limit);
        const take = Number.isInteger(parsedLimit)
            ? Math.min(100, Math.max(1, parsedLimit))
            : 18;

        return this.dashboardClient.send(DASHBOARD_PATTERNS.IMAGE_GET_BY_ESTABLISHMENT, {
            establishmentId: establishment.id,
            cursor,
            limit: take,
            search,
        });
    }

    @Roles()

    @Patch(':id')
    @RateLimit('MEDIUM') // 30 req/min — rename de imagem
    async updateImageName(
        @Param('id') id: string,
        @Body() body: UpdateImageDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IMAGE_UPDATE, {
            id,
            establishmentId: establishment.id,
            fileName: body.fileName,
        });
    }

    @Roles()

    @Post('delete')
    @RateLimit('MEDIUM') // 30 req/min — delete de imagens
    async deleteImages(
        @Body() body: { imageIds: string[] },
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IMAGE_DELETE, {
            imageIds: body.imageIds,
            establishmentId: establishment.id,
        });
    }

    @Roles()
    @RequiresFeature(feature.images)
    @UseGuards(FeatureLimitGuard)
    @Post('direct-upload-urls')
    @RateLimit('MEDIUM') // 30 req/min — gera URLs de upload
    async generateR2DirectUploadUrls(
        @Body() body: GenerateUploadUrlsDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IMAGE_GENERATE_R2_UPLOAD_URLS, {
            count: body.count,
            establishmentId: establishment.id,
        });
    }

    @Roles()

    @Post('confirm-direct-uploads')
    @RateLimit('MEDIUM') // 30 req/min — confirma uploads
    async confirmDirectUploads(
        @Body() body: ConfirmUploadsDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IMAGE_CONFIRM_UPLOAD, {
            images: body.images,
            establishmentId: establishment.id,
        });
    }
}
