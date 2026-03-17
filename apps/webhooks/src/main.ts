import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { WebhooksModule } from './webhooks.module';
import { AllRpcExceptionsFilter } from '@weats/common';
import { GatewayConfigService } from '@weats/configs';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(WebhooksModule);
  const configService = appContext.get(GatewayConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    WebhooksModule,
    configService.webhooksClientOptions as MicroserviceOptions,
  );

  app.useGlobalFilters(new AllRpcExceptionsFilter());
  await app.listen();
}
bootstrap();
