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

  // Helmet security middleware
  if (shouldEnableHelmet(nodeEnv)) {
    app.use(helmet(helmetConfig));
    logger.log('🛡️  Helmet security enabled (Production mode)');
  } else {
    logger.log('⚠️  Helmet security disabled (Development mode)');
  }

  app.use('/v1/webhooks/clerk', express.raw({ type: '*/*' }));
  app.use('/v1/webhooks/stripe', express.raw({ type: '*/*' }));
  app.use('/v1/webhooks/eupago', express.raw({ type: '*/*' })); // cobre /eupago/:establishmentId

  app.enableCors(getCorsOptions(appConfigService));
  app.use(cookieParser());

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
  // Get the underlying Express instance from Nest's HTTP adapter so we can mount
  // third-party express middleware/routers (like bull-board).
  // `server` above is the raw Node http.Server which does not have `.use()`.
  const expressApp = app.getHttpAdapter().getInstance() as express.Express;

  // pegar filas registradas no Nest
  //const webhookQueue = app.get<Queue>(getQueueToken('webhook-queue'));
  /*
  const emailQueue = app.get<Queue>(getQueueToken('emails'));
  const qrCodesQueue = app.get<Queue>(getQueueToken('qrcodes'));

  const serverAdapter = new BBExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullAdapter(emailQueue),
      new BullAdapter(qrCodesQueue),
    ],
    serverAdapter,
  });
  */

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
