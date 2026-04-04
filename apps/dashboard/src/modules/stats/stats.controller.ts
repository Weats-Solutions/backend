import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { StatsService } from './stats.service';

@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @MessagePattern(DASHBOARD_PATTERNS.DASHBOARD_STATS_GET)
  async getStats(@Payload() payload: { establishmentId: string }) {
    return this.statsService.getDashboardStats(payload.establishmentId);
  }
}
