import { Roles, ClerkGuard, EstablishmentStaffGuard, CurrentEstablishment, FeatureLimitGuard, RequiresFeature, ApiAuthenticated } from "@weats/common";
import { Controller, UseGuards, Param, Post, Body, Get, Patch, Delete, Put } from "@nestjs/common";
import { EmployeeRoles } from "@weats/database";
import { CreateSubcategoryDto, UpdateSubcategoryPositionsDto } from "@weats/contracts";
import { MenuSubcategoryService } from './subcategory.service';
import { Establishment, feature } from "@weats/types";
import { LinkItemToSubcategoryDto } from "@weats/contracts/dashboard/dtos/item/link-item-to-subcategory.dto";
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Menu Subcategories')
@ApiParam({ name: 'menuId', description: 'ID do menu' })
@ApiParam({ name: 'categoryId', description: 'ID da categoria' })
@Controller('menus/:menuId/categories/:categoryId/subcategories')
export class MenuSubcategoryController {
    constructor(private readonly subcategoryService: MenuSubcategoryService) { }

    @Roles(EmployeeRoles.MANAGER)
    @Put('/positions')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar as posições/ordem das subcategorias de uma categoria' })
    @ApiOkResponse({ description: 'Posições das subcategorias atualizadas com sucesso' })
    updateSubcategoryPositions(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
        @Body() updateSubcategoryPositionsDto: UpdateSubcategoryPositionsDto,
    ) {
        return this.subcategoryService.updateSubcategoryPositions(menuId, categoryId, updateSubcategoryPositionsDto);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Get()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar todas as subcategorias de uma categoria' })
    @ApiOkResponse({ description: 'Lista de subcategorias obtida com sucesso' })
    listSubcategories(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
    ) {
        return this.subcategoryService.listSubcategories(menuId, categoryId);
    }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature(feature.menu_subcategories)
    @UseGuards(FeatureLimitGuard)
    @Post()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Criar uma nova subcategoria' })
    @ApiCreatedResponse({ description: 'Subcategoria criada com sucesso' })
    createSubcategory(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
        @Body() createSubcategoryDto: CreateSubcategoryDto,
    ) {
        return this.subcategoryService.createSubcategory(menuId, categoryId, createSubcategoryDto);
    }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature(feature.menu_subcategories)
    @UseGuards(FeatureLimitGuard)
    @Patch('/:subcategoryId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar dados de uma subcategoria existente' })
    @ApiParam({ name: 'subcategoryId', description: 'ID da subcategoria a atualizar' })
    @ApiBody({ type: CreateSubcategoryDto })
    @ApiOkResponse({ description: 'Subcategoria atualizada com sucesso' })
    updateSubcategory(
        @Param('menuId') menuId: string,
        @Param('subcategoryId') subcategoryId: string,
        @Body() updateSubcategoryDto: any,
    ) {
        return this.subcategoryService.updateSubcategory(menuId, subcategoryId, updateSubcategoryDto);
    }

    @Get('/:subcategoryId/items')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar itens de uma subcategoria' })
    @ApiParam({ name: 'subcategoryId', description: 'ID da subcategoria' })
    @ApiOkResponse({ description: 'Lista de itens obtida com sucesso' })
    listSubcategoryItems(
        @CurrentEstablishment() establishment: Establishment,
        @Param('subcategoryId') subcategoryId: string,
    ) {
        return this.subcategoryService.getSubcategoryItems(establishment, subcategoryId);
    }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature(feature.menu_subcategories)
    @UseGuards(FeatureLimitGuard)
    @Delete('/:subcategoryId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover uma subcategoria' })
    @ApiParam({ name: 'subcategoryId', description: 'ID da subcategoria a remover' })
    @ApiOkResponse({ description: 'Subcategoria removida com sucesso' })
    deleteSubcategory(
        @Param('menuId') menuId: string,
        @Param('subcategoryId') subcategoryId: string,
    ) {
        return this.subcategoryService.deleteSubcategory(menuId, subcategoryId);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Post('/:subcategoryId/items')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Vincular itens a uma subcategoria' })
    @ApiParam({ name: 'subcategoryId', description: 'ID da subcategoria' })
    @ApiCreatedResponse({ description: 'Itens vinculados com sucesso' })
    linkItemsToSubcategory(
        @Body() linkItemToSubcategoryDto: LinkItemToSubcategoryDto,
    ) {
        return this.subcategoryService.linkItemsToSubcategory(linkItemToSubcategoryDto);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Delete('/:subcategoryId/items')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Desvincular itens de uma subcategoria em lote' })
    @ApiParam({ name: 'subcategoryId', description: 'ID da subcategoria' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                itemIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lista de IDs dos itens a desvincular'
                }
            },
            required: ['itemIds']
        }
    })
    @ApiOkResponse({ description: 'Itens desvinculados com sucesso' })
    unlinkItemsFromSubcategory(
        @Param('subcategoryId') subcategoryId: string,
        @Body() body: { itemIds: string[] },
    ) {
        return this.subcategoryService.unlinkItemsFromSubcategory(subcategoryId, body.itemIds);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Put('/:subcategoryId/items/positions')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar posições/ordem dos itens na subcategoria' })
    @ApiParam({ name: 'subcategoryId', description: 'ID da subcategoria' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                positions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'ID do item' },
                            position: { type: 'number', description: 'Nova posição do item' }
                        },
                        required: ['id', 'position']
                    },
                    description: 'Lista com as novas posições dos itens'
                }
            },
            required: ['positions']
        }
    })
    @ApiOkResponse({ description: 'Posições dos itens atualizadas com sucesso' })
    updateItemPositions(
        @Param('subcategoryId') subcategoryId: string,
        @Body() body: { positions: { id: string, position: number }[] },
    ) {
        return this.subcategoryService.updateItemPositions(subcategoryId, body.positions);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch('/:subcategoryId/items/link')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar propriedades de vinculação dos itens' })
    @ApiParam({ name: 'subcategoryId', description: 'ID da subcategoria' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                itemIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lista de IDs dos itens'
                },
                data: {
                    type: 'object',
                    properties: {
                        isVisible: { type: 'boolean', description: 'Se o item está visível na subcategoria' },
                        isIncluded: { type: 'boolean', description: 'Se o item está incluído na subcategoria' }
                    }
                }
            },
            required: ['itemIds', 'data']
        }
    })
    @ApiOkResponse({ description: 'Propriedades de vinculação atualizadas com sucesso' })
    updateItemsLinkProperties(
        @Param('subcategoryId') subcategoryId: string,
        @Body() body: { itemIds: string[], data: { isVisible?: boolean, isIncluded?: boolean } },
    ) {
        return this.subcategoryService.updateItemsLinkProperties(subcategoryId, body.itemIds, body.data);
    }
}