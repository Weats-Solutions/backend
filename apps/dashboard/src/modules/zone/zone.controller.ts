import { Controller } from '@nestjs/common';
import { DASHBOARD_PATTERNS } from '@weats/common';
import { CreateServiceZoneDto, UpdateServiceZoneDto } from '@weats/contracts';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { Establishment } from '@weats/types';
import { ZoneService } from './zone.service';


@Controller()
export class ZoneController {
    constructor(private readonly zoneService: ZoneService) { }

    @MessagePattern(DASHBOARD_PATTERNS.ZONE_CREATE)
    async createServiceZone(
        @Payload() payload: {
            createServiceZoneDto: CreateServiceZoneDto,
            establishment: Establishment,
        },
    ) {
        return this.zoneService.createServiceZone(payload.createServiceZoneDto, payload.establishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ZONE_GET_ALL)
    async getServiceZones(
        @Payload() payload: {
            establishment: Establishment,
        },
    ) {
        return this.zoneService.getServiceZones(payload.establishment.id);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ZONE_GET_BY_ID)
    async getServiceZoneById(
        @Payload() payload: {
            zoneId: string,
            establishmentId: string,
        },
    ) {
        return this.zoneService.getServiceZoneById(payload.zoneId, payload.establishmentId);
    }


    @MessagePattern(DASHBOARD_PATTERNS.ZONE_UPDATE)
    async updateServiceZone(
        @Payload() payload: {
            zoneId: string,
            updateServiceZoneDto: UpdateServiceZoneDto,
        },
    ) {
        return this.zoneService.updateServiceZone(payload.zoneId, payload.updateServiceZoneDto);
    }


    @MessagePattern(DASHBOARD_PATTERNS.ZONE_DELETE)
    async deleteServiceZone(
        @Payload() payload: {
            zoneId: string,
        },
    ) {
        return this.zoneService.deleteServiceZone(payload.zoneId);
    }
}
