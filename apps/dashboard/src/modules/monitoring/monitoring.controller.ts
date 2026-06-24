import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { Public, SkipActiveSubscription, SkipEstablishmentStaff, SkipRateLimit } from '@weats/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { register } from 'prom-client';

@ApiTags('monitoring')
@Controller({
  version: VERSION_NEUTRAL,
})
export class MonitoringController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  @Get('health')
  @Public()
  @SkipActiveSubscription()
  @SkipEstablishmentStaff()
  @SkipRateLimit()
  @HealthCheck()
  @ApiOperation({ summary: 'Check dashboard service health' })
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB heap limit
      () => this.prismaHealth.isHealthy('databases'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('metrics')
  @Public()
  @SkipActiveSubscription()
  @SkipEstablishmentStaff()
  @SkipRateLimit()
  @ApiOperation({ summary: 'Expose Prometheus metrics' })
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
