import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Inject,
} from '@nestjs/common';
import { ClerkGuard, EstablishmentStaffGuard, CurrentEstablishment, CurrentUser, Roles, DASHBOARD_SERVICE, DASHBOARD_PATTERNS } from '@weats/common';
import { Establishment, User } from '@weats/types';
import { CreateServiceZoneDto, UpdateServiceZoneDto } from '@weats/contracts';
import { EmployeeRoles } from '@weats/database';
import { ClientProxy } from '@nestjs/microservices';

@Controller('zones')

export class ZonesController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

    @Roles(EmployeeRoles.MANAGER)

    @Post()
    async createServiceZone(
        @CurrentEstablishment() establishment: Establishment,
        @Body() createServiceZoneDto: CreateServiceZoneDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ZONE_CREATE, { createServiceZoneDto, establishment });
    }


    @Get()
    async getServiceZones(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ZONE_GET_ALL, { establishment });
    }


    @Get(':zoneId')
    async getServiceZoneById(
        @Param('zoneId') zoneId: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ZONE_GET_BY_ID, { zoneId, establishmentId: establishment.id });
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch(':zoneId')
    async updateServiceZone(
        @Param('zoneId') zoneId: string,
        @Body() dto: UpdateServiceZoneDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ZONE_UPDATE, { zoneId, updateServiceZoneDto: dto });
    }

    @Roles(EmployeeRoles.MANAGER)

    @Delete(':zoneId')
    async deleteServiceZone(
        @Param('zoneId') zoneId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ZONE_DELETE, { zoneId });
    }
}
