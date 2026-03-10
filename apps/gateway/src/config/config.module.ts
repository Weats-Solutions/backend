import { Module } from '@nestjs/common';
import { GatewayConfigService } from './config.service';

@Module({
  providers: [GatewayConfigService],
  exports: [GatewayConfigService],
})
export class GatewayConfigModule {}
