import { PlanController } from './plan.controller';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { PlanService } from './plan.service';

@Module({
    imports: [
        DatabaseModule,
    ],
    controllers: [PlanController],
    providers: [
        PlanService,
    ],
    exports: [PlanService],
})
export class PlanModule { }
