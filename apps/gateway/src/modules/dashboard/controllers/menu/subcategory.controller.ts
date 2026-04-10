import { Roles, ClerkGuard, EstablishmentStaffGuard } from "@weats/common";
import { Controller, UseGuards, Param, Post, Body, Get, Patch, Delete } from "@nestjs/common";
import { EmployeeRoles } from "@weats/database";
import { CreateSubcategoryDto, UpdateSubcategoryPositionsDto } from "@weats/contracts";
import { DASHBOARD_SERVICE, DASHBOARD_PATTERNS } from "@weats/common";
import { ClientProxy } from '@nestjs/microservices';
import { Inject, Put } from '@nestjs/common';


@Controller("menus/:menuId/categories/:categoryId/subcategories")
export class MenuSubcategoryController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Put('/positions')
    updateSubcategoryPositions(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
        @Body() updateSubcategoryPositionsDto: UpdateSubcategoryPositionsDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_UPDATE_POSITIONS, { 
            menuId, 
            categoryId, 
            updateSubcategoryPositionsDto 
        });
    }

    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Get()
    listSubcategories(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_GET_BY_CATEGORY, { menuId, categoryId });
    }


    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post()
    createSubcategory(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
        @Body() createSubcategoryDto: CreateSubcategoryDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_CREATE, { menuId, categoryId, createSubcategoryDto });
    }

    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Patch('/:subcategoryId')
    updateSubcategory(
        @Param('subcategoryId') subcategoryId: string,
        @Body() updateSubcategoryDto: any,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_EDIT, { subcategoryId, updateSubcategoryDto });
    }

    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Delete('/:subcategoryId')
    deleteSubcategory(
        @Param('subcategoryId') subcategoryId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_DELETE, { subcategoryId });
    }

    @Post('/:subcategoryId/items/:itemId')
    linkItemToSubcategory(
        @Param('subcategoryId') subcategoryId: string,
        @Param('itemId') itemId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_LINK_ITEM, { subcategoryId, itemId });
    }


}