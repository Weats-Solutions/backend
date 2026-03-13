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
import { DASHBOARD_PATTERNS } from '@weats/contracts/dashboard/dashboard.patterns';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '@weats/common';



@Controller('images')
export class ImageController {
    constructor(
        @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
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

        return this.dashboardClient.send(DASHBOARD_PATTERNS.IMAGE_GET_BY_ESTABLISHMENT, {
            establishmentId: establishment.id,
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
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IMAGE_UPDATE, {
            id,
            establishmentId: establishment.id,
            fileName: body.fileName,
        });
    }

    @Roles()
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post('delete')
    @ThrottleWrite()
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
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post('direct-upload-urls')
    @ThrottleWrite()
    async generateDirectUploadUrls(
        @Body() body: GenerateUploadUrlsDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.IMAGE_GENERATE_UPLOAD_URLS, {
            count: body.count,
            establishmentId: establishment.id,
        });
    }

    @Roles()
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post('confirm-direct-uploads')
    @ThrottleWrite()
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
