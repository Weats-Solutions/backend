import { Module } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { DatabaseModule } from '@weats/database';
import { ClerkConfigService } from '@weats/configs/clerk-config.service';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [ClerkService, ClerkConfigService],
  exports: [ClerkService],
  controllers: [],
})
export class ClerkModule { }
