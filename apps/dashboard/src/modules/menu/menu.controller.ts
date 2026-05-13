import {
    Controller
} from '@nestjs/common';
import { CreateMenuDto, UpdateMenuDto, UpdateMenuPositionsDto } from '@weats/contracts';
import { MenuService } from './menu.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common';
import { Establishment } from '@weats/types';

@Controller()
export class MenuController {
    constructor(private readonly menuService: MenuService) { }

    @MessagePattern(DASHBOARD_PATTERNS.MENU_LIST)
    listMenus(@Payload() payload: { establishment: Establishment }) {
        return this.menuService.listMenus(payload.establishment);
    }


    @MessagePattern(DASHBOARD_PATTERNS.MENU_GET_BY_ID)
    getMenuDetails(
        @Payload() payload: { menuId: string, establishment: Establishment },
    ) {
        return this.menuService.getMenuDetails(payload.menuId, payload.establishment);
    }


    @MessagePattern(DASHBOARD_PATTERNS.MENU_CREATE)
    createMenu(
        @Payload() payload: { createMenuDto: CreateMenuDto, establishment: Establishment },
    ) {
        return this.menuService.createMenu(payload.createMenuDto, payload.establishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.MENU_UPDATE)
    updateMenu(
        @Payload() payload: { menuId: string, updateMenuDto: CreateMenuDto, establishment: Establishment },
    ) {
        return this.menuService.updateMenu(payload.menuId, payload.updateMenuDto, payload.establishment);
    }


    @MessagePattern(DASHBOARD_PATTERNS.MENU_UPDATE_SETTINGS)
    updateMenuSettings(
        @Payload() payload: { menuId: string, updateMenuDto: UpdateMenuDto, establishment: Establishment },
    ) {
        return this.menuService.updateMenuSettings(
            payload.menuId,
            payload.updateMenuDto,
            payload.establishment,
        );
    }


    @MessagePattern(DASHBOARD_PATTERNS.MENU_UPDATE_POSITIONS)
    updateMenuPositions(
        @Payload() payload: { updateMenuPositionsDto: UpdateMenuPositionsDto, establishment: Establishment },
    ) {
        return this.menuService.updateMenuPositions(
            payload.updateMenuPositionsDto,
            payload.establishment,
        );
    }

    @MessagePattern(DASHBOARD_PATTERNS.MENU_DELETE)
    deleteMenu(@Payload() payload: { menuId: string, establishment: Establishment }) {
        return this.menuService.deleteMenu(payload.menuId, payload.establishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.MENU_DUPLICATE)
    duplicateMenu(@Payload() payload: { menuId: string, establishment: Establishment }) {
        return this.menuService.duplicateMenu(payload.menuId, payload.establishment);
    }
}
