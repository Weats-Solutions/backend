import { Controller } from '@nestjs/common';
import { DASHBOARD_PATTERNS } from '@weats/common';
import { CreateServicePointDto, UpdateServicePointDto } from '@weats/contracts';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { ZonePointService } from './zone-point.service';

@Controller()
export class ZonePointController {
    constructor(private readonly zonePointService: ZonePointService) { }

    @MessagePattern(DASHBOARD_PATTERNS.POINT_CREATE)
    async createServicePoint(
        @Payload() payload: { zoneId: string, createServicePointDto: CreateServicePointDto },
    ) {
        return this.zonePointService.createServicePoint(payload.zoneId, payload.createServicePointDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.POINT_GET_ALL)
    async getServicePoints(
        @Payload() payload: { zoneId: string },
    ) {
        return this.zonePointService.getServicePoints(payload.zoneId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.POINT_GET_BY_ID)
    async getServicePointById(
        @Payload() payload: { pointId: string, zoneId: string, establishmentId: string },
    ) {
        return this.zonePointService.getServicePointById(payload.pointId, payload.zoneId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.POINT_UPDATE)
    async updateServicePoint(
        @Payload() payload: { pointId: string, updateServicePointDto: UpdateServicePointDto },
    ) {
        return this.zonePointService.updateServicePoint(payload.pointId, payload.updateServicePointDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.POINT_DELETE)
    async deleteServicePoint(
        @Payload() payload: { pointId: string },
    ) {
        return this.zonePointService.deleteServicePoint(payload.pointId);
    }
}
