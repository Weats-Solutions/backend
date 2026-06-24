import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AddonService } from './addon.service';
import { CreateAddonDto, UpdateAddonDto } from '@weats/contracts';
import { Establishment, feature } from '@weats/types';
import { ApiAuthenticated, CurrentEstablishment, FeatureLimitGuard, RequiresFeature, Roles } from '@weats/common';
import { EmployeeRoles } from '@weats/database';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';


@ApiTags('Item Addons')
@Controller('items/addons')
export class AddonController {
    constructor(private readonly addonService: AddonService) { }

    @RequiresFeature(feature.custom_addons)
    @UseGuards(FeatureLimitGuard)
    @Roles(EmployeeRoles.MANAGER)
    @Post()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Criar um novo addon' })
    @ApiCreatedResponse({ description: 'Addon criado com sucesso' })
    create(
        @CurrentEstablishment() establishment: Establishment,
        @Body() createAddonDto: CreateAddonDto,
    ) {
        return this.addonService.create(establishment, createAddonDto);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch(':id')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar um addon existente' })
    @ApiParam({ name: 'id', description: 'ID do addon' })
    @ApiOkResponse({ description: 'Addon atualizado com sucesso' })
    edit(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
        @Body() updateAddonDto: UpdateAddonDto,
    ) {
        return this.addonService.edit(establishment.id, id, updateAddonDto);
    }



    @Roles(EmployeeRoles.MANAGER, EmployeeRoles.WAITER, EmployeeRoles.KITCHEN)
    @Get()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar todos os addons do estabelecimento' })
    @ApiOkResponse({ description: 'Lista de todos os addons' })
    findAddonsByEstablishment(@CurrentEstablishment() establishment: Establishment) {
        return this.addonService.findAddonsByEstablishment(establishment.id);
    }
}
