// src/items/item.controller.ts
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ItemService } from './item.service';
import {
  CreateItemDto,
  UpdateItemDto,
  BulkStatusDto,
  BulkDeleteDto,
  GetItemsQueryDto,
  UpdateItemPlacementsDto,
} from '@weats/contracts';
import { Establishment, feature } from '@weats/types';
import { ApiAuthenticated, CurrentEstablishment, FeatureLimitGuard, RequiresFeature } from '@weats/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiNoContentResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Items')
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) { }


  @Post()
  @RequiresFeature(feature.products)
  @UseGuards(FeatureLimitGuard)
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Criar um novo produto' })
  @ApiCreatedResponse({ description: 'Produto criado com sucesso' })
  async createItem(
    @CurrentEstablishment() establishment: Establishment,
    @Body() createItemDto: CreateItemDto,
  ) {
    return this.itemService.createItem(
      establishment.id,
      createItemDto,
    );
  }


  @Put(':id')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Atualizar um produto existente' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ description: 'Produto atualizado com sucesso' })
  async updateItem(
    @Param('id') id: string,
    @CurrentEstablishment() establishment: Establishment,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.itemService.updateItem(
      id,
      establishment,
      updateItemDto,
    );
  }



  @Get('establishment')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Listar produtos do estabelecimento' })
  @ApiOkResponse({ description: 'Lista de produtos obtida com sucesso' })
  async getItems(
    @CurrentEstablishment() establishment: Establishment,
    @Query() query: GetItemsQueryDto,
  ) {
    return this.itemService.getItemsForDashboard(
      establishment,
      query,
    );
  }



  @Get('allergens')
  @ApiOperation({ summary: 'Obter tabela de alergénios' })
  @ApiOkResponse({ description: 'Lista de alergénios obtida com sucesso' })
  async getAllergens() {
    return this.itemService.getAllergens();
  }




  @Get('taxes')
  @ApiOperation({ summary: 'Obter tabela de taxas de IVA' })
  @ApiOkResponse({ description: 'Tabela de taxas de IVA obtida com sucesso' })
  async getTaxTables() {
    return this.itemService.getTaxTables();
  }



  @Get(':id')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Obter detalhes de um produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ description: 'Detalhes do produto' })
  async getItem(@Param('id') id: string) {
    return this.itemService.getItemById(id);
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Apagar produtos em lote' })
  @ApiOkResponse({ description: 'Produtos apagados em lote com sucesso' })
  async bulkDelete(
    @CurrentEstablishment() establishment: Establishment,
    @Body() bulkDeleteDto: BulkDeleteDto,
  ) {
    return this.itemService.bulkDelete(
      bulkDeleteDto,
      establishment.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Apagar um produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiNoContentResponse({ description: 'Produto apagado com sucesso' })
  async deleteItem(
    @Param('id') id: string,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.itemService.deleteItem(id, establishment.id);
  }

  @Post(':id/duplicate')
  @RequiresFeature(feature.products)
  @UseGuards(FeatureLimitGuard)
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Duplicar um produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiCreatedResponse({ description: 'Produto duplicado com sucesso' })
  async duplicateItem(
    @Param('id') id: string,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.itemService.duplicateItem(id, establishment);
  }

  @Patch('bulk/status')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Atualizar estado (ativo/inativo) de produtos em lote' })
  @ApiOkResponse({ description: 'Estados atualizados com sucesso' })
  async bulkUpdateStatus(
    @CurrentEstablishment() establishment: Establishment,
    @Body() bulkStatusDto: BulkStatusDto,
  ) {
    return this.itemService.bulkUpdateStatus(
      bulkStatusDto,
      establishment.id,
    );
  }

  @Get(':id/placements')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Obter menus e subcategorias onde o produto está associado' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ description: 'Associações do produto obtidas com sucesso' })
  async getItemPlacements(
    @Param('id') id: string,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.itemService.getItemPlacements(
      id,
      establishment,
    );
  }

  @Put(':id/placements')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Atualizar menus e subcategorias associados ao produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiOkResponse({ description: 'Associações do produto atualizadas com sucesso' })
  async updateItemPlacements(
    @Param('id') id: string,
    @CurrentEstablishment() establishment: Establishment,
    @Body() body: UpdateItemPlacementsDto,
  ) {
    const menuIds = body.menus?.map((menu) => menu.menuId) ?? [];
    const subcategoryIdsFromMenus =
      body.menus?.flatMap((menu) => menu.subcategoryIds) ?? [];
    const subcategoryIds = Array.from(
      new Set([...(body.subcategoryIds ?? []), ...subcategoryIdsFromMenus]),
    );

    if (!body.subcategoryIds && !body.menus) {
      throw new BadRequestException('Provide either subcategoryIds or menus');
    }

    return this.itemService.updateItemPlacements(
      id,
      establishment,
      subcategoryIds,
      menuIds,
    );
  }
}
