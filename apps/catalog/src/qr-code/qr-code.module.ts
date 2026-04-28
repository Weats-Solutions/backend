import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { QrCodeController } from './qr-code.controller';
import { QrCodeService } from './qr-code.service';
import { ConfigsModule, AppConfigService } from '@weats/configs';

@Module({
  imports: [DatabaseModule, ConfigsModule],
  controllers: [QrCodeController],
  providers: [
    QrCodeService,
    {
      provide: 'CATALOG_URL',
      useFactory: (appConfig: AppConfigService) => appConfig.getCatalogUrl(),
      inject: [AppConfigService],
    },
  ],
})
export class QrCodeModule { }
