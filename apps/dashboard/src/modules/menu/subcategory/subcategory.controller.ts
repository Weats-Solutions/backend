import { Roles, ClerkGuard, EstablishmentStaffGuard } from "@weats/common";
import { Controller, UseGuards, Param, Post, Body, Get, Patch, Delete } from "@nestjs/common";
import { EmployeeRoles } from "@weats/database";
import { CreateSubcategoryDto } from "@weats/contracts";
import { DASHBOARD_PATTERNS } from "@weats/common";
import { MenuSubcategoryService } from './subcategory.service';
import { MessagePattern, Payload } from "@nestjs/microservices";


@Controller()
export class MenuSubcategoryController {
    constructor(private readonly subcategoryService: MenuSubcategoryService) { }


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
        return this.subcategoryService.createSubcategory(payload.categoryId, payload.createSubcategoryDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_EDIT)
    updateSubcategory(
        @Payload() payload: { subcategoryId: string, updateSubcategoryDto: any },
    ) {
        return this.subcategoryService.updateSubcategory(payload.subcategoryId, payload.updateSubcategoryDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_DELETE)
    deleteSubcategory(
        @Payload() payload: { subcategoryId: string },
    ) {
        return this.subcategoryService.deleteSubcategory(payload.subcategoryId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.SUBCATEGORY_LINK_ITEM)
    linkItemToSubcategory(
        @Payload() payload: { subcategoryId: string, itemId: string },
    ) {
        return this.subcategoryService.linkItemToSubcategory(payload.subcategoryId, payload.itemId);
    }
}