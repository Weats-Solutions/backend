import { NestFactory } from '@nestjs/core';
import { WebhooksModule } from './webhooks.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WebhooksBootstrap');
  
  // Criamos uma aplicação HTTP normal em vez de um Microservice
  // rawBody: true é essencial para validar as assinaturas da Stripe/Clerk
  const app = await NestFactory.create(WebhooksModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('WEBHOOKS_CLIENT_PORT') || 3003;

  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 Webhooks service is running directly on port: ${port}`);
  logger.log(`Stripe endpoint: /v1/webhooks/stripe`);
  logger.log(`Clerk endpoint: /v1/webhooks/clerk`);
}
bootstrap();
