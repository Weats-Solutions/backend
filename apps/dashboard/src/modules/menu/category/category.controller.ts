import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards
} from '@nestjs/common';
import { Establishment, feature } from '@weats/types';
import { CreateCategoryDto, UpdateCategoryPositionsDto } from '@weats/contracts';
import { ApiAuthenticated, CurrentEstablishment, FeatureLimitGuard, RequiresFeature, Roles } from '@weats/common';
import { MenuCategoryService } from './category.service';
import { EmployeeRoles } from '@weats/database';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Menu Categories')
@ApiParam({ name: 'menuId', description: 'ID do menu' })
@Controller('menus/:menuId/categories')
export class MenuCategoryController {
    constructor(private readonly categoryService: MenuCategoryService) { }


    @Roles(EmployeeRoles.MANAGER)
    @Put('/positions')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar as posições/ordem das categorias de um menu' })
    @ApiOkResponse({ description: 'Posições das categorias atualizadas com sucesso' })
    updateCategoryPositions(
        @Param('menuId') menuId: string,
        @Body() updateCategoryPositionsDto: UpdateCategoryPositionsDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.categoryService.updateCategoryPositions(menuId, updateCategoryPositionsDto, currentEstablishment);
    }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature(feature.menu_categories)
    @UseGuards(FeatureLimitGuard)
    @Post()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Criar uma nova categoria num menu' })
    @ApiCreatedResponse({ description: 'Categoria criada com sucesso' })
    createCategory(
        @Param('menuId') menuId: string,
        @Body() createCategoryDto: CreateCategoryDto,
    ) {
        return this.categoryService.createCategory(menuId, createCategoryDto);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Get()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar todas as categorias de um menu' })
    @ApiOkResponse({ description: 'Lista de categorias obtida com sucesso' })
    listMenuCategories(
        @Param('menuId') menuId: string,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.categoryService.listMenuCategories(menuId, currentEstablishment);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Put('/:categoryId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar dados de uma categoria existente' })
    @ApiParam({ name: 'categoryId', description: 'ID da categoria a atualizar' })
    @ApiOkResponse({ description: 'Categoria atualizada com sucesso' })
    updateCategory(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
        @Body() updateCategoryDto: CreateCategoryDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.categoryService.updateCategory(menuId, categoryId, updateCategoryDto, currentEstablishment);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Delete('/:categoryId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover uma categoria de um menu' })
    @ApiParam({ name: 'categoryId', description: 'ID da categoria a remover' })
    @ApiOkResponse({ description: 'Categoria removida com sucesso' })
    deleteCategory(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.categoryService.deleteCategory(menuId, categoryId, currentEstablishment);
    }
}
