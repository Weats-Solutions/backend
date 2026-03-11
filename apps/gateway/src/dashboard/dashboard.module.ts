import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ClientProxyFactory } from '@nestjs/microservices';
import { GatewayConfigService } from '@weats/configs/gateway-config.service';
import { DASHBOARD_SERVICE } from '@weats/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    DashboardService,
    {
      provide: DASHBOARD_SERVICE,
      useFactory: (configService: GatewayConfigService) => {
        const clientOptions = configService.dashboardClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [GatewayConfigService],
    },
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
