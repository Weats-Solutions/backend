import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CurrentEstablishment } from '@weats/common/decorators/current-establishment.decorator';
import { ClerkGuard } from '@weats/common/guards/clerk.guard';
import { EstablishmentStaffGuard } from '@weats/common/guards/establishment-staff.guard';
import { DASHBOARD_SERVICE } from '@weats/common';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { Establishment } from '@weats/types';

@Controller('dashboard')

export class StatsController {
  constructor(
    @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
  ) { }

  @Get('stats')
  getDashboardStats(@CurrentEstablishment() establishment: Establishment) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.DASHBOARD_STATS_GET, {
      establishmentId: establishment.id,
    });
  }
}
