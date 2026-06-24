import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    UseGuards
} from '@nestjs/common';
import { CreateMenuDto, UpdateMenuDto, UpdateMenuPositionsDto } from '@weats/contracts';
import { MenuService } from './menu.service';
import { Establishment, User } from '@weats/types';
import { ActiveSubscriptionGuard, ApiAuthenticated, ClerkGuard, CurrentEstablishment, CurrentUser, EstablishmentStaffGuard, FeatureLimitGuard, RequiresFeature, Roles } from '@weats/common';
import { EmployeeRoles } from '@weats/database';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Menus')
@Controller('menus')
export class MenuController {
    constructor(private readonly menuService: MenuService) { }

    @Get('list')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar todos os menus do estabelecimento' })
    @ApiOkResponse({ description: 'Lista de menus obtida com sucesso' })
    listMenus(@CurrentEstablishment() currentEstablishment: Establishment) {
        return this.menuService.listMenus(currentEstablishment);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Get('/:menuId/details')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter detalhes de um menu' })
    @ApiParam({ name: 'menuId', description: 'ID do menu' })
    @ApiOkResponse({ description: 'Detalhes do menu obtidos com sucesso' })
    getMenuDetails(
        @Param('menuId') menuId: string,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.menuService.getMenuDetails(menuId, currentEstablishment);
    }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature('menu')
    @UseGuards(FeatureLimitGuard)
    @Post()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Criar um novo menu' })
    @ApiCreatedResponse({ description: 'Menu criado com sucesso' })
    createMenu(
        @Body() createMenuDto: CreateMenuDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.menuService.createMenu(createMenuDto, currentEstablishment);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Put('/positions')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar as posições/ordem dos menus' })
    @ApiOkResponse({ description: 'Posições dos menus atualizadas com sucesso' })
    updateMenuPositions(
        @Body() updateMenuPositionsDto: UpdateMenuPositionsDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.menuService.updateMenuPositions(
            updateMenuPositionsDto,
            currentEstablishment,
        );
    }

    @Roles(EmployeeRoles.MANAGER)
    @Put('/:menuId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar dados de um menu existente' })
    @ApiParam({ name: 'menuId', description: 'ID do menu' })
    @ApiOkResponse({ description: 'Menu atualizado com sucesso' })
    updateMenu(
        @Param('menuId') menuId: string,
        @Body() updateMenuDto: CreateMenuDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.menuService.updateMenu(menuId, updateMenuDto, currentEstablishment);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch('/:menuId/settings')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar as configurações de um menu específico' })
    @ApiParam({ name: 'menuId', description: 'ID do menu' })
    @ApiOkResponse({ description: 'Configurações do menu atualizadas com sucesso' })
    updateMenuSettings(
        @Param('menuId') menuId: string,
        @Body() updateMenuDto: UpdateMenuDto,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.menuService.updateMenuSettings(
            menuId,
            updateMenuDto,
            currentEstablishment,
        );
    }

    @Roles(EmployeeRoles.MANAGER)
    @Delete('/:menuId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover um menu' })
    @ApiParam({ name: 'menuId', description: 'ID do menu' })
    @ApiOkResponse({ description: 'Menu removido com sucesso' })
    deleteMenu(@Param('menuId') menuId: string, @CurrentEstablishment() currentEstablishment: Establishment) {
        return this.menuService.deleteMenu(menuId, currentEstablishment);
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
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Duplicar um menu no mesmo estabelecimento' })
    @ApiParam({ name: 'menuId', description: 'ID do menu a duplicar' })
    @ApiCreatedResponse({ description: 'Menu duplicado com sucesso' })
    duplicateMenu(
        @Param('menuId') menuId: string,
        @CurrentEstablishment() currentEstablishment: Establishment,
    ) {
        return this.menuService.duplicateMenu(menuId, currentEstablishment);
    }

    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(
        ClerkGuard,
        EstablishmentStaffGuard,
        ActiveSubscriptionGuard,
    )
    @Post('/:menuId/duplicate-precheck')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Validar duplicação de menu para outro estabelecimento' })
    @ApiParam({ name: 'menuId', description: 'ID do menu a duplicar' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                targetEstablishmentId: { type: 'string', description: 'ID do estabelecimento de destino' },
                reuseExistingItemsBySku: { type: 'boolean', description: 'Reutilizar itens existentes pelo SKU no destino', default: true }
            },
            required: ['targetEstablishmentId']
        }
    })
    @ApiOkResponse({ description: 'Pré-verificação efetuada com sucesso' })
    duplicateMenuPrecheck(
        @Param('menuId') menuId: string,
        @Body() body: { targetEstablishmentId: string; reuseExistingItemsBySku?: boolean },
        @CurrentUser() user: User,
    ) {
        return this.menuService.duplicateMenuPrecheck(
            menuId,
            body.targetEstablishmentId,
            body.reuseExistingItemsBySku ?? true,
            user,
        );
    }


    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(
        ClerkGuard,
        EstablishmentStaffGuard,
        ActiveSubscriptionGuard,
    )
    @Post('/:menuId/duplicate-to-establishment')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Executar a duplicação do menu para outro estabelecimento' })
    @ApiParam({ name: 'menuId', description: 'ID do menu a duplicar' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                targetEstablishmentId: { type: 'string', description: 'ID do estabelecimento de destino' },
                idempotencyKey: { type: 'string', description: 'Chave de idempotência da transação' },
                reuseExistingItemsBySku: { type: 'boolean', description: 'Reutilizar itens existentes pelo SKU no destino', default: true }
            },
            required: ['targetEstablishmentId', 'idempotencyKey']
        }
    })
    @ApiCreatedResponse({ description: 'Menu duplicado para o estabelecimento de destino com sucesso' })
    duplicateMenuToEstablishment(
        @Param('menuId') menuId: string,
        @Body() body: { targetEstablishmentId: string; idempotencyKey: string; reuseExistingItemsBySku?: boolean },
        @CurrentUser() user: User,
    ) {
        return this.menuService.duplicateMenuToEstablishment(
            menuId,
            body.targetEstablishmentId,
            body.idempotencyKey,
            body.reuseExistingItemsBySku ?? true,
            user,
        );
    }
}
