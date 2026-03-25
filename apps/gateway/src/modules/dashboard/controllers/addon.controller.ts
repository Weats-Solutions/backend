import { Body, Controller, Get, Param, Patch, Post, UseGuards, Inject } from '@nestjs/common';
import { ClerkGuard, CurrentEstablishment, EstablishmentStaffGuard, Roles } from '@weats/common';
import { EmployeeRoles } from '@weats/database';
import { CreateAddonDto, UpdateAddonDto } from '@weats/contracts';
import { Establishment } from '@weats/types';
import { DASHBOARD_SERVICE, DASHBOARD_PATTERNS } from '@weats/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('items/addons')
@UseGuards(ClerkGuard, EstablishmentStaffGuard)
export class AddonController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

    @Roles(EmployeeRoles.MANAGER)
    @Post()
    create(
        @CurrentEstablishment() establishment: Establishment,
        @Body() createAddonDto: CreateAddonDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ADDON_CREATE, { establishment, createAddonDto });
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch(':id')
    edit(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
        @Body() updateAddonDto: UpdateAddonDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ADDON_EDIT, { establishmentId: establishment.id, addonId: id, updateAddonDto });
    }

    @Roles(EmployeeRoles.MANAGER, EmployeeRoles.WAITER, EmployeeRoles.KITCHEN)
    @Get()
    findAddonsByEstablishment(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ADDON_GET_BY_ESTABLISHMENT, { establishmentId: establishment.id });
    }
}
