import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiAuthenticated, CurrentEstablishment, Roles } from '@weats/common';
import { CreateServiceZoneDto, UpdateServiceZoneDto } from '@weats/contracts';
import { Establishment } from '@weats/types';
import { ZoneService } from './zone.service';
import { EmployeeRoles } from '@weats/database';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';


@ApiTags('Service Zones')
@Controller('zones')
export class ZoneController {
    constructor(private readonly zoneService: ZoneService) { }

    @Roles(EmployeeRoles.MANAGER)
    @Post()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Criar uma nova zona de serviço' })
    @ApiCreatedResponse({ description: 'Zona de serviço criada com sucesso' })
    async createServiceZone(
        @CurrentEstablishment() establishment: Establishment,
        @Body() createServiceZoneDto: CreateServiceZoneDto,
    ) {
        return this.zoneService.createServiceZone(createServiceZoneDto, establishment);
    }

    @Get()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar todas as zonas de serviço do estabelecimento' })
    @ApiOkResponse({ description: 'Lista de zonas de serviço obtida com sucesso' })
    async getServiceZones(@CurrentEstablishment() establishment: Establishment) {
        return this.zoneService.getServiceZones(establishment.id);
    }

    @Get(':zoneId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter detalhes de uma zona de serviço específica' })
    @ApiParam({ name: 'zoneId', description: 'ID da zona de serviço' })
    @ApiOkResponse({ description: 'Detalhes da zona de serviço obtidos com sucesso' })
    async getServiceZoneById(
        @Param('zoneId') zoneId: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.zoneService.getServiceZoneById(zoneId, establishment.id);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch(':zoneId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar uma zona de serviço existente' })
    @ApiParam({ name: 'zoneId', description: 'ID da zona de serviço' })
    @ApiOkResponse({ description: 'Zona de serviço atualizada com sucesso' })
    async updateServiceZone(
        @Param('zoneId') zoneId: string,
        @Body() updateServiceZoneDto: UpdateServiceZoneDto,
    ) {
        return this.zoneService.updateServiceZone(zoneId, updateServiceZoneDto);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Delete(':zoneId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover uma zona de serviço' })
    @ApiParam({ name: 'zoneId', description: 'ID da zona de serviço' })
    @ApiOkResponse({ description: 'Zona de serviço removida com sucesso' })
    async deleteServiceZone(
        @Param('zoneId') zoneId: string,
    ) {
        return this.zoneService.deleteServiceZone(zoneId);
    }
}
