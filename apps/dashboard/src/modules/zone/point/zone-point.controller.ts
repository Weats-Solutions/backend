import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiAuthenticated, FeatureLimitGuard, RequiresFeature, Roles } from '@weats/common';
import { CreateServicePointDto, UpdateServicePointDto } from '@weats/contracts';
import { ZonePointService } from './zone-point.service';
import { EmployeeRoles } from '@weats/database';
import { feature } from '@weats/types';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Service Points')
@ApiParam({ name: 'zoneId', description: 'ID da zona de serviço' })
@Controller('zones/:zoneId/points')
export class ZonePointController {
    constructor(private readonly zonePointService: ZonePointService) { }

    @Roles(EmployeeRoles.MANAGER)
    @RequiresFeature(feature.points)
    @UseGuards(FeatureLimitGuard)
    @Post()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Criar um novo ponto de serviço' })
    @ApiCreatedResponse({ description: 'Ponto de serviço criado com sucesso' })
    async createServicePoint(
        @Param('zoneId') zoneId: string,
        @Body() createServicePointDto: CreateServicePointDto,
    ) {
        return this.zonePointService.createServicePoint(zoneId, createServicePointDto);
    }

    @Get()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar todos os pontos de serviço de uma zona' })
    @ApiOkResponse({ description: 'Lista de pontos de serviço obtida com sucesso' })
    async getServicePoints(
        @Param('zoneId') zoneId: string,
    ) {
        return this.zonePointService.getServicePoints(zoneId);
    }

    @Get(':pointId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter detalhes de um ponto de serviço específico' })
    @ApiParam({ name: 'pointId', description: 'ID do ponto de serviço' })
    @ApiOkResponse({ description: 'Detalhes do ponto de serviço obtidos com sucesso' })
    async getServicePointById(
        @Param('zoneId') zoneId: string,
        @Param('pointId') pointId: string,
    ) {
        return this.zonePointService.getServicePointById(pointId, zoneId);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch(':pointId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar um ponto de serviço existente' })
    @ApiParam({ name: 'pointId', description: 'ID do ponto de serviço' })
    @ApiOkResponse({ description: 'Ponto de serviço atualizado com sucesso' })
    async updateServicePoint(
        @Param('pointId') pointId: string,
        @Body() updateServicePointDto: UpdateServicePointDto,
    ) {
        return this.zonePointService.updateServicePoint(pointId, updateServicePointDto);
    }


    @Roles(EmployeeRoles.MANAGER)
    @Delete(':pointId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover um ponto de serviço' })
    @ApiParam({ name: 'pointId', description: 'ID do ponto de serviço' })
    @ApiOkResponse({ description: 'Ponto de serviço removido com sucesso' })
    async deleteServicePoint(
        @Param('pointId') pointId: string,
    ) {
        return this.zonePointService.deleteServicePoint(pointId);
    }
}
