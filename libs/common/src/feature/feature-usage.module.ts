import { Module } from '@nestjs/common';
import { FeatureUsageService } from './feature-usage.service';
import { DatabaseModule } from '@weats/database';

@Module({
  imports: [DatabaseModule],
  providers: [FeatureUsageService],
  exports: [FeatureUsageService],
})
export class FeatureUsageModule {}
