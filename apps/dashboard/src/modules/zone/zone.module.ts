import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QUEUES } from '@weats/bull';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@weats/database';
import { FeatureUsageModule } from '@weats/common/feature/feature-usage.module';
import { QrGeneratorModule } from '@weats/common/qr/qr-generator.module';
import { ZoneService } from './zone.service';
import { ZonePointService } from './point/zone-point.service';
import { ZonePointController } from './point/zone-point.controller';
import { ZoneController } from './zone.controller';
import { QrCodesController } from './qr-codes/qr-codes.controller';
import { QrCodesService } from './qr-codes/qr-codes.service';

@Module({
    imports: [
        DatabaseModule,
        ConfigModule,
        FeatureUsageModule,
        QrGeneratorModule,
        BullModule.registerQueue({
            name: QUEUES.QRCODE,
        }),
    ],
    controllers: [ZoneController, ZonePointController, QrCodesController],
    providers: [
        ZoneService,
        ZonePointService,
        QrCodesService,
    ],
    exports: [
        ZoneService,
        ZonePointService,
    ],
})
export class ZoneModule { }
