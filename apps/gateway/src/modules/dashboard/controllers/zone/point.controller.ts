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
import { ClerkGuard, EstablishmentStaffGuard, RequiresFeature, FeatureLimitGuard, Roles, DASHBOARD_SERVICE, DASHBOARD_PATTERNS } from '@weats/common';
import { CreateServicePointDto, UpdateServicePointDto } from '@weats/contracts';
import { feature } from '@weats/types';
import { EmployeeRoles } from '@weats/database';
import { ClientProxy } from '@nestjs/microservices';

@Controller('zones/:zoneId/points')
@UseGuards(ClerkGuard, EstablishmentStaffGuard)
export class ZonePointController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature(feature.points)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard, FeatureLimitGuard)
    @Post()
    async createServicePoint(
        @Param('zoneId') zoneId: string,
        @Body() createServicePointDto: CreateServicePointDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.POINT_CREATE, { zoneId, createServicePointDto });
    }

    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Get()
    async getServicePoints(
        @Param('zoneId') zoneId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.POINT_GET_ALL, { zoneId });
    }

    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Get(':pointId')
    async getServicePointById(
        @Param('zoneId') zoneId: string,
        @Param('pointId') pointId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.POINT_GET_BY_ID, { pointId, zoneId });
    }

    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Patch(':pointId')
    async updateServicePoint(
        @Param('pointId') pointId: string,
        @Body() updateServicePointDto: UpdateServicePointDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.POINT_UPDATE, { pointId, updateServicePointDto });
    }

    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Delete(':pointId')
    async deleteServicePoint(
        @Param('pointId') pointId: string,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.POINT_DELETE, { pointId });
    }
}
