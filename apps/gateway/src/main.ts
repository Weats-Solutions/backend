import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceExceptionFilter } from './common/filters/microservice-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import * as express from 'express';
import { AppConfigService, getCorsOptions, helmetConfig, shouldEnableHelmet } from '@weats/configs';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { EupagoConfigService } from '@weats/configs/eupago-config.service';
import { Queue } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter as BBExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new MicroserviceExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  const appConfigService = app.get(AppConfigService);
  const eupagoConfigService = app.get(EupagoConfigService);
  const apiPort = appConfigService.getApiPort();
  const nodeEnv = appConfigService.getNodeEnv();
  const eupagoEnvironment = eupagoConfigService.getEupagoEnvironment();


  const logger = new Logger('Gateway');
  app.enableCors(getCorsOptions(appConfigService));
  app.use(cookieParser());


  /*
  // Helmet security middleware
  if (shouldEnableHelmet(nodeEnv)) {
    app.use(helmet(helmetConfig));
    logger.log('🛡️  Helmet security enabled (Production mode)');
  } else {
    logger.log('⚠️  Helmet security disabled (Development mode)');
  }
    */

  app.use('/v1/webhooks/clerk', express.raw({ type: '*/*' }));
  app.use('/v1/webhooks/stripe', express.raw({ type: '*/*' }));
  app.use('/v1/webhooks/eupago', express.raw({ type: '*/*' })); // cobre /eupago/:establishmentId



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

  // pegar filas registradas no Nest
  const emailQueue = app.get<Queue>(getQueueToken('emails'));
  const webhookQueue = app.get<Queue>(getQueueToken('webhooks-queue'));

  logger.log(`📊 Registando filas Bull Board...`);
  logger.log(`   - Email queue: ${emailQueue.name} (${emailQueue.client?.options?.host}:${emailQueue.client?.options?.port})`);
  logger.log(`   - Webhooks queue: ${webhookQueue.name} (${webhookQueue.client?.options?.host}:${webhookQueue.client?.options?.port})`);

  // Configurar Bull Board
  const serverAdapter = new BBExpressAdapter();

  // IMPORTANTE: basePath deve match com o route path registado
  // Ambos devem estar sem /v1/ porque a rota é registada antes do versioning
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullAdapter(emailQueue),
      new BullAdapter(webhookQueue),
    ],
    serverAdapter,
  });

  // Registar a rota ANTES do versioning ser aplicado
  app.use('/admin/queues', serverAdapter.getRouter());
  logger.log(`✅ Bull Board disponível em http://localhost:${apiPort}/admin/queues`);


  app.enableShutdownHooks();

  await app.listen(apiPort, () => {
    logger.log(`🚀 Servidor em http://localhost:${apiPort} - ${process.env.NODE_ENV}`);
    logger.log(`Server timeout: ${server.timeout}`);
    server.keepAliveTimeout = 61 * 1000;
    logger.log(`Server keepAliveTimeout: ${server.keepAliveTimeout / 1000}s `);
    server.headersTimeout = 65 * 1000;
    logger.log(`Server headersTimeout: ${server.headersTimeout / 1000}s `);
    logger.log(`Eupago em modo ${eupagoEnvironment}`)
  });
}
bootstrap();
