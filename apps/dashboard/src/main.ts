import { NestFactory } from '@nestjs/core';
import { DashboardModule } from './dashboard.module';
import { Transport } from '@nestjs/microservices';
import { AllRpcExceptionsFilter } from '@weats/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(DashboardModule, {
    transport: Transport.TCP,
    options: { port: 3002 },
  });
  app.useGlobalFilters(new AllRpcExceptionsFilter());
  await app.listen();
}
bootstrap();
