import { NestFactory } from '@nestjs/core';
import { DashboardModule } from './dashboard.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AllRpcExceptionsFilter } from '@weats/common';
import { GatewayConfigService } from '@weats/configs';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(DashboardModule);
  const configService = appContext.get(GatewayConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    DashboardModule,
    {
      transport: Transport.TCP,
      options: {
        port: configService.getDashboardClientPort(),
        // sem host — escuta em 0.0.0.0 automaticamente
      },
    }
  );
  app.useGlobalFilters(new AllRpcExceptionsFilter());
  await app.listen();
}
bootstrap();
