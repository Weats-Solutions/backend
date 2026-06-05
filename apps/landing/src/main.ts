import { NestFactory } from '@nestjs/core';
import { LandingModule } from './landing.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AllRpcExceptionsFilter } from '@weats/common';
import { GatewayConfigService } from '@weats/configs';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(LandingModule);
  const configService = appContext.get(GatewayConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    LandingModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: configService.getLandingClientPort(),

      },
    }
  );
  app.useGlobalFilters(new AllRpcExceptionsFilter());
  await app.listen();
}
bootstrap();
