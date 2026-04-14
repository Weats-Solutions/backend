import { Module, forwardRef } from '@nestjs/common';
import { ClerkModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';
import { ConfigsModule } from '@weats/configs';
import { RealtimeGateway } from './websocket/realtime.gateway';
import { RoomsService } from './rooms/rooms.service';
import { RealtimeService } from './websocket/realtime.service';

@Module({
  imports: [DatabaseModule, ClerkModule, ConfigsModule],
  providers: [RealtimeGateway, RealtimeService, RoomsService],
})
export class RealtimeModule {}
