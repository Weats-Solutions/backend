import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { AppConfigService, getCorsOptions } from '@weats/configs';
import cookieParser from 'cookie-parser';

import { MicroserviceExceptionFilter } from '@weats/common/filters/microservice-exception.filter';
import { ResponseInterceptor } from '@weats/common/interceptors/response.interceptor';

import { EupagoConfigService } from '@weats/configs/eupago-config.service';

import { Queue } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter as BBExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { QUEUES } from '@weats/bull/queues/queues.constants';

import {
  CorePrismaService,
  OrdersPrismaService,
} from '@weats/database';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Gateway');

  // =========================
  // SERVICES
  // =========================
  const appConfigService = app.get(AppConfigService);
  const eupagoConfigService = app.get(EupagoConfigService);

  const corePrisma = app.get(CorePrismaService);
  const ordersPrisma = app.get(OrdersPrismaService);

  const dashboardPort = appConfigService.getDashboardPort();
  const nodeEnv = appConfigService.getNodeEnv();
  const eupagoEnvironment = eupagoConfigService.getEupagoEnvironment();

  // =========================
  // GLOBAL MIDDLEWARE
  // =========================
  app.set('trust proxy', true);
  app.enableCors(getCorsOptions(appConfigService));
  app.use(cookieParser());
  app.use(helmet());


  app.useGlobalFilters(new MicroserviceExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // =========================
  // BULL BOARD
  // =========================
  const emailQueue = app.get<Queue>(getQueueToken(QUEUES.EMAIL));
  const webhookQueue = app.get<Queue>(getQueueToken(QUEUES.WEBHOOK));
  const imageQueue = app.get<Queue>(getQueueToken(QUEUES.IMAGE));
  const qrCodeQueue = app.get<Queue>(getQueueToken(QUEUES.QRCODE));
  const languageSyncQueue = app.get<Queue>(getQueueToken(QUEUES.LANGUAGES));

  const serverAdapter = new BBExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullAdapter(emailQueue),
      new BullAdapter(webhookQueue),
      new BullAdapter(imageQueue),
      new BullAdapter(qrCodeQueue),
      new BullAdapter(languageSyncQueue),
    ],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  // =========================
  // SERVER OPTIMIZATIONS
  // =========================
  const server = app.getHttpServer();
  server.keepAliveTimeout = 61 * 1000;
  server.headersTimeout = 65 * 1000;

  app.enableShutdownHooks();

  // =========================
  // STARTUP SEQUENCE (SAFE)
  // =========================

  // DB connections FIRST (fail fast se algo estiver errado)
  await corePrisma.$connect();
  await ordersPrisma.$connect();

  // Start server only after dependencies are ready
  await app.listen(dashboardPort);

  // =========================
  // LOGS (AGRUPADOS NO FINAL)
  // =========================
  logger.log('===================================');
  logger.log(`🚀 Gateway running on http://localhost:${dashboardPort}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`💳 Eupago mode: ${eupagoEnvironment}`);
  logger.log(`⏱ KeepAlive: ${server.keepAliveTimeout / 1000}s`);
  logger.log(`⏱ HeadersTimeout: ${server.headersTimeout / 1000}s`);
  logger.log('===================================');

  logger.log('📦 Database connections:');
  logger.log('✔ Core Database connected');
  logger.log('✔ Orders Database connected');

  logger.log('⚡ Bull queues:');
  logger.log('✔ Email queue ready');
  logger.log('✔ Webhook queue ready');
  logger.log('✔ Image queue ready');
  logger.log('✔ QR Code queue ready');
  logger.log('✔ Language sync queue ready');

  logger.log('===================================');
  logger.log('📊 Admin panel: /admin/queues');
  logger.log('===================================');

  // =========================
  // GRACEFUL SHUTDOWN
  // =========================
  process.on('SIGTERM', async () => {
    logger.warn('SIGTERM received, shutting down...');

    await app.close();
    await corePrisma.$disconnect();
    await ordersPrisma.$disconnect();

    logger.log('Graceful shutdown completed');
  });

  process.on('SIGINT', async () => {
    logger.warn('SIGINT received, shutting down...');

    await app.close();
    await corePrisma.$disconnect();
    await ordersPrisma.$disconnect();

    logger.log('Graceful shutdown completed');
  });
}

bootstrap();
