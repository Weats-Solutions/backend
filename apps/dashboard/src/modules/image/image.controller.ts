import { ImageService } from './image.service';
import { CloudflareR2Service } from '@weats/integrations/cloudflare/cloudflare-r2.service';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Establishment, feature } from '@weats/types';
import { Roles, RateLimit, CurrentEstablishment, RequiresFeature, FeatureLimitGuard, ApiAuthenticated } from '@weats/common';
import { UpdateImageDto, GenerateUploadUrlsDto, ConfirmUploadsDto } from '@weats/contracts';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam, ApiQuery } from '@nestjs/swagger';


@ApiTags('Images')
@Controller('images')
export class ImageController {
    constructor(
        private readonly imageService: ImageService,
        private readonly cloudflareR2Service: CloudflareR2Service,
    ) { }

    @Roles()
    @Get()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar imagens do estabelecimento' })
    @ApiQuery({ name: 'cursor', required: false, description: 'Cursor para paginação' })
    @ApiQuery({ name: 'limit', required: false, description: 'Número de itens a retornar', schema: { default: '5' } })
    @ApiQuery({ name: 'search', required: false, description: 'Termo de pesquisa por nome do ficheiro' })
    @ApiOkResponse({ description: 'Lista de imagens obtida com sucesso' })
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

        return this.imageService.findImagesByEstablishment(establishment.id, {
            cursor: cursor,
            limit: take,
            search: search,
        });
    }


    @Roles()
    @Patch(':id')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar nome do ficheiro da imagem' })
    @ApiParam({ name: 'id', description: 'ID da imagem' })
    @ApiOkResponse({ description: 'Nome da imagem atualizado com sucesso' })
    @RateLimit('MEDIUM') // 30 req/min — rename de imagem
    async updateImageName(
        @Param('id') id: string,
        @Body() body: UpdateImageDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.imageService.updateImageName(
            id,
            establishment.id,
            body.fileName,
        );
    }



    @Roles()
    @RequiresFeature(feature.images)
    @UseGuards(FeatureLimitGuard)
    @Post('direct-upload-urls')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar URLs pré-assinados para upload direto para o Cloudflare R2' })
    @ApiCreatedResponse({ description: 'URLs de upload gerados com sucesso' })
    @RateLimit('MEDIUM') // 30 req/min — gera URLs de upload
    async generateR2DirectUploadUrls(
        @Body() body: GenerateUploadUrlsDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        const urls = await this.cloudflareR2Service.generateUploadUrls(
            body.count,
            establishment.id,
        );
        return { urls };
    }



    @Roles()
    @Post('confirm-direct-uploads')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Confirmar uploads diretos para o Cloudflare R2 concluídos' })
    @ApiCreatedResponse({ description: 'Uploads confirmados e registados com sucesso' })
    @RateLimit('MEDIUM') // 30 req/min — confirma uploads
    async confirmDirectUploads(
        @Body() body: ConfirmUploadsDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.imageService.confirmDirectUploads(
            body.images,
            establishment.id,
        );
    }
}
