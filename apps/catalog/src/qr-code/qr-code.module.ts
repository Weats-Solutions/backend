import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@weats/database';
import { QrCodeController } from './qr-code.controller';
import { QrCodeService } from './qr-code.service';
import { ConfigsModule, AppConfigService } from '@weats/configs';

@Module({
  imports: [
    DatabaseModule,
    ConfigsModule,
    JwtModule.registerAsync({
      imports: [ConfigsModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.getQrSessionSecret(),
        signOptions: {
          expiresIn: '2h',
          issuer: 'weats-catalog',
          audience: 'weats-menu',
        },
      }),
    }),
  ],
  controllers: [QrCodeController],
  providers: [
    QrCodeService,
    {
      provide: 'CATALOG_MENU_URL',
      useFactory: (appConfig: AppConfigService) => appConfig.getCatalogMenuUrl(),
      inject: [AppConfigService],
    },
    {
      provide: 'WEATS_ENV',
      useFactory: (appConfig: AppConfigService) => appConfig.getWeatsEnv(),
      inject: [AppConfigService],
    },
  ],
})
export class QrCodeModule { }
