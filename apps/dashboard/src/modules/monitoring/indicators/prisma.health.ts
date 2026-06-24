import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { CorePrismaService, OrdersPrismaService } from '@weats/database';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly corePrisma: CorePrismaService,
    private readonly ordersPrisma: OrdersPrismaService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      // Execute a lightweight query on both databases to test connection
      await this.corePrisma.$queryRaw`SELECT 1`;
      await this.ordersPrisma.$queryRaw`SELECT 1`;
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: error.message });
    }
  }
}
