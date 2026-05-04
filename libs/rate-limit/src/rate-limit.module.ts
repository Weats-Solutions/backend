import { Module } from '@nestjs/common';
import { ConfigsModule } from '@weats/configs';
import { RateLimitService } from './rate-limit.service';
import { rateLimiterProvider, rateLimitRedisProvider } from './rate-limit.provider';

@Module({
  imports: [ConfigsModule],
  providers: [RateLimitService, rateLimitRedisProvider, rateLimiterProvider],
  exports: [RateLimitService, rateLimitRedisProvider, rateLimiterProvider],
})
export class RateLimitModule {}
