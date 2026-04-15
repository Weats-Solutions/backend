import { Module } from '@nestjs/common';
import { ClerkModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';
import { ConfigsModule } from '@weats/configs';
import { ConfigModule } from '@nestjs/config';
import { RealtimeGateway } from './websocket/realtime.gateway';
import { RoomsService } from './rooms/rooms.service';
import { RealtimeService } from './websocket/realtime.service';
import { RealtimeController } from './realtime.controller';
import { RealtimeStateService } from './websocket/state.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    DatabaseModule, 
    ClerkModule, 
    ConfigsModule
  ],
  controllers: [RealtimeController],
  providers: [RealtimeGateway, RealtimeService, RoomsService, RealtimeStateService],
})
export class RealtimeModule {}
