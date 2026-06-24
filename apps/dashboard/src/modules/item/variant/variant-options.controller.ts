import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { VariantOptionsService } from './variant-options.service';
import { CreateVariantOptionDto, UpdateVariantOptionDto } from '@weats/contracts';
import { Establishment, feature } from '@weats/types';
import { ApiAuthenticated, CurrentEstablishment, FeatureLimitGuard, RequiresFeature } from '@weats/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Variant Options')
@Controller('items/variants-options')
export class VariantOptionsController {
  constructor(private readonly service: VariantOptionsService) { }

  @RequiresFeature(feature.custom_variants)
  @UseGuards(FeatureLimitGuard)
  @Post()
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Criar uma nova opção de variante' })
  @ApiCreatedResponse({ description: 'Opção de variante criada com sucesso' })
  async create(
    @CurrentEstablishment() establishment: Establishment,
    @Body() createVariantOptionDto: CreateVariantOptionDto,
  ) {
    return this.service.create(establishment, createVariantOptionDto);
  }

  @Get()
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Listar todas as opções de variante do estabelecimento' })
  @ApiOkResponse({ description: 'Lista de opções de variante obtida com sucesso' })
  async listAll(@CurrentEstablishment() establishment: Establishment) {
    return this.service.findAll(establishment);
  }

  @Get(':id')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Obter detalhes de uma opção de variante' })
  @ApiParam({ name: 'id', description: 'ID da opção de variante' })
  @ApiOkResponse({ description: 'Detalhes da opção de variante obtidos com sucesso' })
  async get(@Param('id') id: string) {
    return this.service.getById(id);
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
    return this.service.update(id, updateVariantOptionDto, establishment);
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
    return this.service.remove(id, establishment);
  }
}
