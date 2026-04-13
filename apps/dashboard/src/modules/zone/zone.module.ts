import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { FeatureUsageModule } from '@weats/common/feature/feature-usage.module';
import { ZoneService } from './zone.service';
import { ZonePointService } from './point/zone-point.service';
import { ZonePointController } from './point/zone-point.controller';
import { ZoneController } from './zone.controller';

@Module({
    imports: [
        DatabaseModule,
        FeatureUsageModule
    ],
    controllers: [ZoneController, ZonePointController],
    providers: [
        ZoneService,
        ZonePointService,
    ],
    exports: [
        ZoneService,
        ZonePointService,
    ],
})
export class ZoneModule { }
