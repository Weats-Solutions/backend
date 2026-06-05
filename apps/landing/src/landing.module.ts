import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LandingController],
  providers: [LandingService],
})
export class LandingModule {}
