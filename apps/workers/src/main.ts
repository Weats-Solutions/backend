import { NestFactory } from '@nestjs/core';
import { WorkersModule } from './workers.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WorkersBootstrap');
  const app = await NestFactory.createApplicationContext(WorkersModule);

  app.enableShutdownHooks();

  logger.log('Workers application context initialized. Listening to queues...');
}
bootstrap();
