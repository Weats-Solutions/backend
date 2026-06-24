import { Module, Global } from '@nestjs/common';
import { FeatureUsageService } from './feature-usage.service';
import { DatabaseModule } from '@weats/database';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [FeatureUsageService],
  exports: [FeatureUsageService],
})
export class FeatureUsageModule {}
