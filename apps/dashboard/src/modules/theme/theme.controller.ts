import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CreateThemeDto } from '@weats/contracts/dashboard/dtos/theme/create-theme.dto';
import { Establishment, feature } from '@weats/types';
import { ThemeService } from './theme.service';
import { ApiAuthenticated, CurrentEstablishment, RequiresFeature, FeatureLimitGuard } from '@weats/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Themes')
@Controller('themes')
export class ThemeController {
    constructor(
        private readonly themeService: ThemeService,
    ) { }

    @Get()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar todos os temas do estabelecimento' })
    @ApiOkResponse({ description: 'Lista de temas obtida com sucesso' })
    async getThemes(
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.themeService.getAllThemes(establishment.id);
    }


    @Get('active')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter o tema ativo do estabelecimento' })
    @ApiOkResponse({ description: 'Tema ativo do estabelecimento' })
    async getActiveTheme(
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.themeService.getActiveTheme(establishment.id);
    }

    @RequiresFeature(feature.theme_builder)
    @UseGuards(FeatureLimitGuard)
    @Post()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Criar um novo tema para o estabelecimento' })
    @ApiCreatedResponse({ description: 'Tema criado com sucesso' })
    async createTheme(
        @Body() createThemeDto: CreateThemeDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.themeService.createTheme(createThemeDto, establishment);
    }

    @RequiresFeature(feature.theme_builder)
    @UseGuards(FeatureLimitGuard)
    @Patch(':themeId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar um tema existente' })
    @ApiParam({ name: 'themeId', description: 'ID do tema a atualizar' })
    @ApiOkResponse({ description: 'Tema atualizado com sucesso' })
    async updateTheme(
        @Param('themeId') themeId: string,
        @Body() updateThemeDto: CreateThemeDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.themeService.updateTheme(themeId, updateThemeDto, establishment);
    }

    @Get(':themeId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter detalhes de um tema específico' })
    @ApiParam({ name: 'themeId', description: 'ID do tema' })
    @ApiOkResponse({ description: 'Detalhes do tema obtidos com sucesso' })
    async getThemeById(
        @Param('themeId') themeId: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.themeService.getThemeById(themeId, establishment.id);
    }

    @Post('set-active')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Definir tema como ativo para o estabelecimento' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                themeId: { type: 'string', description: 'ID do tema a ser definido como ativo' }
            },
            required: ['themeId']
        }
    })
    @ApiOkResponse({ description: 'Tema definido como ativo com sucesso' })
    async setActiveTheme(
        @Body() body: { themeId: string },
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.themeService.setActiveTheme(establishment.id, body.themeId);
    }
} 