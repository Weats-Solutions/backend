import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ClientProxyFactory } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '@weats/common';
import { ConfigsModule } from '@weats/configs';
import { GatewayConfigService } from '@weats/configs/gateway-config.service';

@Module({
  imports: [ConfigsModule],
  providers: [
    UsersService,
    {
      provide: DASHBOARD_SERVICE,
      useFactory: (configService: GatewayConfigService) => {
        const clientOptions = configService.dashboardClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [GatewayConfigService],
    },
  ],
  controllers: [UsersController],
})
export class UsersModule {}
