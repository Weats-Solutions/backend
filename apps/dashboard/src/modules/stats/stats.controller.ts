import { Controller, Get } from '@nestjs/common';
import { ApiAuthenticated, CurrentEstablishment } from '@weats/common';
import { Establishment } from '@weats/types';
import { StatsService } from './stats.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Dashboard Stats')
@Controller('dashboard')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('stats')
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Obter estatísticas globais do dashboard' })
  @ApiOkResponse({ description: 'Estatísticas obtidas com sucesso' })
  async getStats(@CurrentEstablishment() establishment: Establishment) {
    return this.statsService.getDashboardStats(establishment.id);
  }
}
