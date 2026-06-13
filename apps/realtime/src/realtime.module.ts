import { Module } from '@nestjs/common';
import { ClerkGuard, EstablishmentStaffGuard } from '@weats/common';
import { JwtModule } from '@nestjs/jwt';
import { ClerkModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';
import { ConfigsModule, AppConfigService } from '@weats/configs';
import { CacheModule } from '@weats/cache';
import { ConfigModule } from '@nestjs/config';
import { RoomsService } from './rooms/rooms.service';
import { RealtimeStateService } from './websocket-v2/state.service';
import { RealtimeV2Controller } from './realtime-v2.controller';
import { RealtimeV2StaffGateway } from './websocket-v2/staff.gateway';
import { RealtimeV2ClientAuthService } from './websocket-v2/client-auth.service';
import { RealtimeV2StaffAuthService } from './websocket-v2/staff-auth.service';
import { RealtimeV2DispatchService } from './websocket-v2/dispatch.service';
import { RealtimeV2SecurityService } from './websocket-v2/security.service';

import { RealtimeV2AdminController } from './websocket-v2/admin.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    DatabaseModule,
    ClerkModule,
    ConfigsModule,
    CacheModule,
    JwtModule.registerAsync({
      imports: [ConfigsModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.getQrSessionSecret(),
      }),
    }),
  ],
  controllers: [RealtimeV2Controller, RealtimeV2AdminController],
  providers: [
    RoomsService,
    RealtimeStateService,
    RealtimeV2StaffGateway,
    RealtimeV2ClientAuthService,
    RealtimeV2StaffAuthService,
    RealtimeV2DispatchService,
    RealtimeV2SecurityService,
    ClerkGuard,
    EstablishmentStaffGuard,
  ],
})
export class RealtimeModule { }
