import {
    Body,
    Controller, Delete, Get,
    Param, Post,
    Put,
    UseGuards
} from '@nestjs/common';
import { ClerkGuard, EstablishmentStaffGuard, CurrentEstablishment, Roles, RequiresFeature, FeatureLimitGuard } from '@weats/common';
import { EmployeeRoles } from '@weats/database';
import { Establishment, feature } from '@weats/types';
import { CreateCategoryDto, UpdateCategoryPositionsDto } from '@weats/contracts';
import { DASHBOARD_SERVICE, DASHBOARD_PATTERNS } from '@weats/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';


@Controller("menus/:menuId/categories")
export class MenuCategoryController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

    @Roles(EmployeeRoles.MANAGER)

    @Put('/positions')
    updateCategoryPositions(
        @Param('menuId') menuId: string,
        @Body() updateCategoryPositionsDto: UpdateCategoryPositionsDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.CATEGORY_UPDATE_POSITIONS, {
            menuId,
            updateCategoryPositionsDto,
            establishment: currentEstablishment
        });
    }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature(feature.menu_categories)
    @UseGuards(FeatureLimitGuard)
    @Post()
    createCategory(
        @Param('menuId') menuId: string,
        @Body() createCategoryDto: CreateCategoryDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.CATEGORY_CREATE, { menuId, createCategoryDto });
    }

    @Roles(EmployeeRoles.MANAGER)
    @Get()
    listMenuCategories(
        @Param('menuId') menuId: string,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.CATEGORY_GET_BY_MENU, { menuId, currentEstablishment });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Put('/:categoryId')
    updateCategory(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
        @Body() updateCategoryDto: CreateCategoryDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.CATEGORY_EDIT, { menuId, categoryId, updateCategoryDto, currentEstablishment });
    }

    @Roles(EmployeeRoles.MANAGER)
    @Delete('/:categoryId')
    deleteCategory(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.CATEGORY_DELETE, { menuId, categoryId, currentEstablishment });
    }

}

