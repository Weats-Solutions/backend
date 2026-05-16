import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkGuard, SkipActiveSubscription, SkipEstablishmentStaff } from '@weats/common';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '@weats/common';
import { Inject } from '@nestjs/common';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';

@Controller('plans')
export class PlanController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    ) { }

    @SkipEstablishmentStaff()
    @SkipActiveSubscription()
    @Get()
    async findAll() {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.PLAN_GET_PLANS, {});
    }
}
