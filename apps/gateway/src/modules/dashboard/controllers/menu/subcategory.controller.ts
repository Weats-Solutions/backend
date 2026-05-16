import { Roles, ClerkGuard, EstablishmentStaffGuard, CurrentEstablishment } from "@weats/common";
import { Controller, UseGuards, Param, Post, Body, Get, Patch, Delete } from "@nestjs/common";
import { EmployeeRoles, Establishment } from "@weats/database";
import { CreateSubcategoryDto, UpdateSubcategoryPositionsDto } from "@weats/contracts";
import { DASHBOARD_SERVICE, DASHBOARD_PATTERNS } from "@weats/common";
import { ClientProxy } from '@nestjs/microservices';
import { Inject, Put } from '@nestjs/common';
import { LinkItemToSubcategoryDto } from "@weats/contracts/dashboard/dtos/item/link-item-to-subcategory.dto";


@Controller("menus/:menuId/categories/:categoryId/subcategories")
export class MenuSubcategoryController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

    @Roles(EmployeeRoles.MANAGER)

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

    @Get()
    listSubcategories(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_GET_BY_CATEGORY, { menuId, categoryId });
    }


    @Roles(EmployeeRoles.MANAGER)

    @Post()
    createSubcategory(
        @Param('menuId') menuId: string,
        @Param('categoryId') categoryId: string,
        @Body() createSubcategoryDto: CreateSubcategoryDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_CREATE, { menuId, categoryId, createSubcategoryDto });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Patch('/:subcategoryId')
    updateSubcategory(
        @Param('menuId') menuId: string,
        @Param('subcategoryId') subcategoryId: string,
        @Body() updateSubcategoryDto: any,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_EDIT, { menuId, subcategoryId, updateSubcategoryDto });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Delete('/:subcategoryId')
    deleteSubcategory(
        @Param('menuId') menuId: string,
        @Param('subcategoryId') subcategoryId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_DELETE, { menuId, subcategoryId });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Get('/:subcategoryId/items')
    listSubcategoryItems(
        @CurrentEstablishment() establishment: Establishment,
        @Param('subcategoryId') subcategoryId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_GET_ITEMS, { establishment, subcategoryId });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Post('/:subcategoryId/items')
    linkItemsToSubcategory(
        @Body() linkItemToSubcategoryDto: LinkItemToSubcategoryDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_LINK_ITEMS, {
            linkItemToSubcategoryDto
        });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Delete('/:subcategoryId/items')
    unlinkItemsFromSubcategory(
        @Param('subcategoryId') subcategoryId: string,
        @Body() body: { itemIds: string[] },
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_UNLINK_ITEMS, {
            subcategoryId,
            itemIds: body.itemIds
        });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Put('/:subcategoryId/items/positions')
    updateItemPositions(
        @Param('subcategoryId') subcategoryId: string,
        @Body() body: { positions: { id: string, position: number }[] },
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_UPDATE_ITEM_POSITIONS, {
            subcategoryId,
            positions: body.positions
        });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Patch('/:subcategoryId/items/link')
    updateItemsLinkProperties(
        @Param('subcategoryId') subcategoryId: string,
        @Body() body: { itemIds: string[], data: { isVisible?: boolean, isIncluded?: boolean } },
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.SUBCATEGORY_UPDATE_ITEMS_LINK, {
            subcategoryId,
            itemIds: body.itemIds,
            data: body.data
        });
    }
}