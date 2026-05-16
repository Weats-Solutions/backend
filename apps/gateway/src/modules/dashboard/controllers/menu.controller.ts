import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Patch,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { CreateMenuDto, UpdateMenuDto, UpdateMenuPositionsDto } from '@weats/contracts';
import { EmployeeRoles } from '@weats/database';
import { Establishment } from '@weats/types';
import { ClientProxy } from '@nestjs/microservices';
import {
    EstablishmentStaffGuard,
    ClerkGuard,
    Roles,
    ActiveSubscriptionGuard,
    RequiresFeature,
    FeatureLimitGuard,
    DASHBOARD_PATTERNS,
    CurrentEstablishment,
    DASHBOARD_SERVICE
} from '@weats/common';

@Controller('menus')
export class MenuController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    ) { }

    @Roles(EmployeeRoles.MANAGER)

    @Get('list')
    listMenus(@CurrentEstablishment() currentEstablishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.MENU_LIST, { establishment: currentEstablishment });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Get('/:menuId/details')
    getMenuDetails(
        @Param('menuId') menuId: string,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.MENU_GET_BY_ID, { menuId, establishment: currentEstablishment });
    }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature('menu')
    @UseGuards(
        ClerkGuard,
        EstablishmentStaffGuard,
        ActiveSubscriptionGuard,
        FeatureLimitGuard,
    )
    @Post()
    createMenu(
        @Body() createMenuDto: CreateMenuDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.MENU_CREATE, { createMenuDto, establishment: currentEstablishment });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Put('/positions')
    updateMenuPositions(
        @Body() updateMenuPositionsDto: UpdateMenuPositionsDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.MENU_UPDATE_POSITIONS, { updateMenuPositionsDto, establishment: currentEstablishment });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Put('/:menuId')
    updateMenu(
        @Param('menuId') menuId: string,
        @Body() updateMenuDto: CreateMenuDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.MENU_UPDATE, { menuId, updateMenuDto, establishment: currentEstablishment });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Patch('/:menuId/settings')
    updateMenuSettings(
        @Param('menuId') menuId: string,
        @Body() updateMenuDto: UpdateMenuDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.MENU_UPDATE_SETTINGS, { menuId, updateMenuDto, establishment: currentEstablishment });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Delete('/:menuId')
    deleteMenu(@Param('menuId') menuId: string, @CurrentEstablishment() currentEstablishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.MENU_DELETE, { menuId, establishment: currentEstablishment });
    }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature('menu')
    @UseGuards(
        ClerkGuard,
        EstablishmentStaffGuard,
        ActiveSubscriptionGuard,
        FeatureLimitGuard,
    )
    @Post('/:menuId/duplicate')
    duplicateMenu(
        @Param('menuId') menuId: string,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.MENU_DUPLICATE, { menuId, establishment: currentEstablishment });
    }
}
