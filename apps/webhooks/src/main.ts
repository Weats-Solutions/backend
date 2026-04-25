import { NestFactory } from '@nestjs/core';
import { WebhooksModule } from './webhooks.module';
import { Logger, VersioningType } from '@nestjs/common';
import { AppConfigService } from '@weats/configs';

async function bootstrap() {
  const logger = new Logger('WebhooksBootstrap');

  // Criamos uma aplicação HTTP normal em vez de um Microservice
  // rawBody: true é essencial para validar as assinaturas da Stripe/Clerk
  const app = await NestFactory.create(WebhooksModule, {
    rawBody: true,
  });

  const appConfigService = app.get(AppConfigService);
  const webhooksPort = appConfigService.getWebhooksPort();

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  app.enableShutdownHooks();

  await app.listen(webhooksPort);
  logger.log(`🚀 Webhooks service is running directly on port: ${webhooksPort}`);
  logger.log(`Stripe endpoint: /v1/webhooks/stripe`);
  logger.log(`Clerk endpoint: /v1/webhooks/clerk`);
}
bootstrap();
