import { Roles, ClerkGuard, EstablishmentStaffGuard } from "@weats/common";
import { Controller, UseGuards, Param, Post, Body, Get, Patch, Delete } from "@nestjs/common";
import { EmployeeRoles } from "@weats/database";
import { CreateSubcategoryDto, UpdateSubcategoryPositionsDto } from "@weats/contracts";
import { DASHBOARD_PATTERNS } from "@weats/common";
import { MenuSubcategoryService } from './subcategory.service';
import { MessagePattern, Payload } from "@nestjs/microservices";
import { Establishment } from "@weats/types";
import { LinkItemToSubcategoryDto } from "@weats/contracts/dashboard/dtos/item/link-item-to-subcategory.dto";


@Controller()
export class MenuSubcategoryController {
    constructor(private readonly subcategoryService: MenuSubcategoryService) { }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_GET_ITEMS)
    getSubcategoryItems(
        @Payload() payload: { establishment: Establishment, subcategoryId: string },
    ) {
        return this.subcategoryService.getSubcategoryItems(payload.establishment, payload.subcategoryId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_UPDATE_POSITIONS)
    updateSubcategoryPositions(
        @Payload() payload: { menuId: string, categoryId: string, updateSubcategoryPositionsDto: UpdateSubcategoryPositionsDto },
    ) {
        return this.subcategoryService.updateSubcategoryPositions(payload.menuId, payload.categoryId, payload.updateSubcategoryPositionsDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_GET_BY_CATEGORY)
    listSubcategories(
        @Payload() payload: { menuId: string, categoryId: string },
    ) {
        return this.subcategoryService.listSubcategories(payload.menuId, payload.categoryId);
    }


    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_CREATE)
    createSubcategory(
        @Payload() payload: { menuId: string, categoryId: string, createSubcategoryDto: CreateSubcategoryDto },
    ) {
        return this.subcategoryService.createSubcategory(payload.menuId, payload.categoryId, payload.createSubcategoryDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_EDIT)
    updateSubcategory(
        @Payload() payload: { menuId: string, subcategoryId: string, updateSubcategoryDto: any },
    ) {
        return this.subcategoryService.updateSubcategory(payload.menuId, payload.subcategoryId, payload.updateSubcategoryDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_DELETE)
    deleteSubcategory(
        @Payload() payload: { menuId: string, subcategoryId: string },
    ) {
        return this.subcategoryService.deleteSubcategory(payload.menuId, payload.subcategoryId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_LINK_ITEMS)
    linkItemsToSubcategory(
        @Payload() payload: { linkItemToSubcategoryDto: LinkItemToSubcategoryDto },
    ) {
        return this.subcategoryService.linkItemsToSubcategory(payload.linkItemToSubcategoryDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_UNLINK_ITEMS)
    unlinkItemsFromSubcategory(
        @Payload() payload: { subcategoryId: string, itemIds: string[] },
    ) {
        return this.subcategoryService.unlinkItemsFromSubcategory(payload.subcategoryId, payload.itemIds);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_UPDATE_ITEM_POSITIONS)
    updateItemPositions(
        @Payload() payload: { subcategoryId: string, positions: { id: string, position: number }[] },
    ) {
        return this.subcategoryService.updateItemPositions(payload.subcategoryId, payload.positions);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_UPDATE_ITEMS_LINK)
    updateItemsLinkProperties(
        @Payload() payload: { subcategoryId: string, itemIds: string[], data: any },
    ) {
        return this.subcategoryService.updateItemsLinkProperties(payload.subcategoryId, payload.itemIds, payload.data);
    }
}