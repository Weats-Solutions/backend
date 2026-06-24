import { Controller, Get } from '@nestjs/common';
import { PlanService } from './plan.service';
import { ApiAuthenticated, SkipActiveSubscription, SkipEstablishmentStaff } from '@weats/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Plans')
@Controller('plans')
export class PlanController {
    constructor(private readonly planService: PlanService) { }

    @SkipEstablishmentStaff()
    @SkipActiveSubscription()
    @Get()
    @ApiAuthenticated({ requireEstablishment: false })
    @ApiOperation({ summary: 'Listar todos os planos de subscrição' })
    @ApiOkResponse({ description: 'Lista de planos obtida com sucesso' })
    async getPlans() {
        return this.planService.getPlans();
    }
}
