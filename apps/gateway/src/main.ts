import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceExceptionFilter } from '@weats/common/filters/microservice-exception.filter';
import { ResponseInterceptor } from '@weats/common/interceptors/response.interceptor';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppConfigService, getCorsOptions } from '@weats/configs';
import cookieParser from 'cookie-parser';
import { EupagoConfigService } from '@weats/configs/eupago-config.service';
import { Queue } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter as BBExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { QUEUES } from '@weats/bull/queues/queues.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new MicroserviceExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  const appConfigService = app.get(AppConfigService);
  const eupagoConfigService = app.get(EupagoConfigService);
  const gatewayPort = appConfigService.getGatewayPort();
  const nodeEnv = appConfigService.getNodeEnv();
  const eupagoEnvironment = eupagoConfigService.getEupagoEnvironment();

  const logger = new Logger('Gateway');
  app.enableCors(getCorsOptions(appConfigService));
  app.use(cookieParser());

  // Obter as queues
  const emailQueue = app.get<Queue>(getQueueToken(QUEUES.EMAIL));
  const webhookQueue = app.get<Queue>(getQueueToken(QUEUES.WEBHOOK));
  const imageQueue = app.get<Queue>(getQueueToken(QUEUES.IMAGE));
  const qrCodeQueue = app.get<Queue>(getQueueToken(QUEUES.QRCODE));
  const languageSyncQueue = app.get<Queue>(getQueueToken(QUEUES.LANGUAGES));

  // Configurar Bull Board ANTES do versionamento e pipes
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
  logger.log(`✅ Bull Board disponível em http://localhost:${gatewayPort}/admin/queues`);

  // Configurações globais do NestJS (Versionamento e Pipes)
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

  const server = app.getHttpServer();

  app.enableShutdownHooks();

  await app.listen(gatewayPort, () => {
    logger.log(`🚀 Servidor em http://localhost:${gatewayPort} - ${nodeEnv}`);
    logger.log(`Server timeout: ${server.timeout}`);
    server.keepAliveTimeout = 61 * 1000;
    logger.log(`Server keepAliveTimeout: ${server.keepAliveTimeout / 1000}s `);
    server.headersTimeout = 65 * 1000;
    logger.log(`Server headersTimeout: ${server.headersTimeout / 1000}s `);
    logger.log(`Eupago em modo ${eupagoEnvironment}`)
  });
}
bootstrap();
