import { Controller } from '@nestjs/common';
import { PlanService } from './plan.service';
import { MessagePattern } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/contracts/dashboard/dashboard.patterns';

@Controller('')
export class PlanController {
    constructor(private readonly planService: PlanService) { }

    @MessagePattern(DASHBOARD_PATTERNS.PLAN_GET_PLANS)
    async getPlans() {
        return this.planService.getPlans();
    }
}
