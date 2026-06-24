import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CreateVariantOptionDto, UpdateVariantOptionDto } from '@weats/contracts';
import { Establishment, feature } from '@weats/types';
import { UseGuards } from '@nestjs/common';
import { ClerkGuard, EstablishmentStaffGuard, CurrentEstablishment, RequiresFeature, FeatureLimitGuard, ApiAuthenticated } from '@weats/common';
import { Inject } from '@nestjs/common';
import { DASHBOARD_SERVICE, DASHBOARD_PATTERNS } from '@weats/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';


@ApiTags('Variant Options')
@Controller('items/variants-options')
export class VariantOptionsController {
  constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

  @RequiresFeature(feature.custom_variants)
  @UseGuards(FeatureLimitGuard)
  @Post()
  async create(
    @CurrentEstablishment() establishment: Establishment,
    @Body() createVariantOptionDto: CreateVariantOptionDto,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_CREATE, { establishment, createVariantOptionDto });
  }

  @Get()
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Listar todas as opções de variante do estabelecimento' })
  @ApiOkResponse({ description: 'Lista de opções de variante obtida com sucesso' })
  async listAll(@CurrentEstablishment() establishment: Establishment) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_GET_BY_ESTABLISHMENT, { establishment });
  }

  @Get(':id')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Obter detalhes de uma opção de variante' })
  @ApiParam({ name: 'id', description: 'ID da opção de variante' })
  @ApiOkResponse({ description: 'Detalhes da opção de variante obtidos com sucesso' })
  async get(@Param('id') id: string) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_GET_BY_ID, { id });
  }

  @Patch(':id')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Atualizar uma opção de variante existente' })
  @ApiParam({ name: 'id', description: 'ID da opção de variante' })
  @ApiOkResponse({ description: 'Opção de variante atualizada com sucesso' })
  async update(
    @Param('id') id: string,
    @Body() updateVariantOptionDto: UpdateVariantOptionDto,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_EDIT, { id, updateVariantOptionDto, establishment });
  }

  @Delete(':id')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Remover uma opção de variante' })
  @ApiParam({ name: 'id', description: 'ID da opção de variante' })
  @ApiOkResponse({ description: 'Opção de variante removida com sucesso' })
  async remove(
    @Param('id') id: string,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_DELETE, { id, establishment });
  }
}
