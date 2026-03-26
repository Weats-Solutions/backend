import {
    Controller
} from '@nestjs/common';
import { Establishment } from '@weats/types';
import { CreateCategoryDto } from '@weats/contracts';
import { DASHBOARD_PATTERNS } from '@weats/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MenuCategoryService } from './category.service';

@Controller()
export class MenuCategoryController {
    constructor(private readonly categoryService: MenuCategoryService) { }

    @MessagePattern(DASHBOARD_PATTERNS.CATEGORY_CREATE)
    createCategory(
        @Payload() payload: { menuId: string, createCategoryDto: CreateCategoryDto },
    ) {
        return this.categoryService.createCategory(payload.menuId, payload.createCategoryDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.CATEGORY_GET_BY_MENU)
    listMenuCategories(
        @Payload() payload: { menuId: string, currentEstablishment: Establishment },
    ) {
        return this.categoryService.listMenuCategories(payload.menuId, payload.currentEstablishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.CATEGORY_EDIT)
    updateCategory(
        @Payload() payload: { menuId: string, categoryId: string, updateCategoryDto: CreateCategoryDto, currentEstablishment: Establishment },
    ) {
        return this.categoryService.updateCategory(payload.menuId, payload.categoryId, payload.updateCategoryDto, payload.currentEstablishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.CATEGORY_DELETE)
    deleteCategory(
        @Payload() payload: { menuId: string, categoryId: string, currentEstablishment: Establishment },
    ) {
        return this.categoryService.deleteCategory(payload.menuId, payload.categoryId, payload.currentEstablishment);
    }

}

