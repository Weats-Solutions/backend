import { Module } from '@nestjs/common';
import { ClientProxyFactory } from '@nestjs/microservices';
import { GatewayConfigService } from '@weats/configs/gateway-config.service';
import { DASHBOARD_SERVICE } from '@weats/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigsModule } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';
import { EstablishmentController } from './establishment/establishment.controller';
import { UserController } from './user/user.controller';
import { PlanController } from './plan/plan.controller';

@Module({
  imports: [ConfigsModule, IntegrationsModule, DatabaseModule],
  providers: [
    {
      provide: DASHBOARD_SERVICE,
      useFactory: (configService: GatewayConfigService) => {
        const clientOptions = configService.dashboardClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [GatewayConfigService],
    },
  ],
  controllers: [EstablishmentController, UserController, PlanController],
})
export class DashboardModule { }
