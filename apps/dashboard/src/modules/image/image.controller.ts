import {
    Body,
    Controller,
    Get,
    Post,
    Patch,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import { CurrentEstablishment } from '@weats/common/decorators/current-establishment.decorator';
import { Roles } from '@weats/common/decorators/roles.decorator';
import { ClerkGuard } from '@weats/common/guards/clerk.guard';
import { EstablishmentStaffGuard } from '@weats/common/guards/establishment-staff.guard';
import { Establishment } from '@weats/types/establishment';
import { CloudflareService } from '@weats/integrations/cloudflare/cloudflare.service';
import { GenerateUploadUrlsDto } from '@weats/contracts/dashboard/dtos/image/upload-urls.dto';
import { ConfirmUploadsDto } from '@weats/contracts/dashboard/dtos/image/confirm-upload.dto';
import { UpdateImageDto } from '@weats/contracts/dashboard/dtos/image/update-image.dto';
import {
    ThrottleRead,
    ThrottleWrite,
} from '@weats/common/decorators/throttle.decorator';
import { ImageService } from './image.service';


@Controller('images')
export class ImagesController {
    constructor(
        private readonly imageService: ImageService,
        private readonly cloudflareService: CloudflareService,
    ) { }

    @Roles()
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Get()
    @ThrottleRead()
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

        return this.imageService.findImagesByEstablishment(establishment.id, {
            cursor,
            limit: take,
            search,
        });
    }

    @Roles()
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Patch(':id')
    @ThrottleWrite()
    async updateImageName(
        @Param('id') id: string,
        @Body() body: UpdateImageDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        const updated = await this.imageService.updateImageName(
            id,
            establishment.id,
            body.fileName,
        );
        return { status: 200, ...updated };
    }

    @Roles()
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post('delete')
    @ThrottleWrite()
    async deleteImages(
        @Body() body: { imageIds: string[] },
        @CurrentEstablishment() establishment: Establishment,
    ) {
        const result = await this.imageService.deleteImagesIfNotInUse(
            body.imageIds,
            establishment.id,
        );
        return { status: 200, ...result };
    }

    @Roles()
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post('direct-upload-urls')
    @ThrottleWrite()
    async generateDirectUploadUrls(
        @Body() body: GenerateUploadUrlsDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        const urls = await this.cloudflareService.generateUploadUrls(
            body.count,
            establishment.id,
        );
        return { urls };
    }

    @Roles()
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post('confirm-direct-uploads')
    @ThrottleWrite()
    async confirmDirectUploads(
        @Body() body: ConfirmUploadsDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        const images = await this.imageService.confirmDirectUploads(
            body.images,
            establishment.id,
        );
        return { success: true, count: images.length, images };
    }
}
