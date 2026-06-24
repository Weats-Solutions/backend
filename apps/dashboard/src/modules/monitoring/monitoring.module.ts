import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DatabaseModule } from '@weats/database';
import { RateLimitModule } from '@weats/rate-limit';
import { MonitoringController } from './monitoring.controller';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpMetricsInterceptor } from './interceptors/http-metrics.interceptor';
import {
  httpRequestDurationSecondsProvider,
  httpRequestsTotalProvider,
} from './providers/metrics.providers';

@Module({
  imports: [
    TerminusModule,
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
    DatabaseModule,
    RateLimitModule,
  ],
  controllers: [MonitoringController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    httpRequestsTotalProvider,
    httpRequestDurationSecondsProvider,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class MonitoringModule {}
