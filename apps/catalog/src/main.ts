import { NestFactory } from '@nestjs/core';
import { ResponseInterceptor } from '@weats/common/interceptors/response.interceptor';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppConfigService, getCorsOptions } from '@weats/configs';
import cookieParser from 'cookie-parser';
import { CatalogModule } from './catalog.module';

async function bootstrap() {
  const app = await NestFactory.create(CatalogModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  const appConfigService = app.get(AppConfigService);
  const catalogPort = appConfigService.getCatalogPort();
  const nodeEnv = appConfigService.getNodeEnv();

  const logger = new Logger('Catalog');
  app.enableCors(getCorsOptions(appConfigService));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const server = app.getHttpServer();

  app.enableShutdownHooks();

  await app.listen(catalogPort, () => {
    logger.log(`🚀 Servidor em http://localhost:${catalogPort} - ${nodeEnv}`);
    logger.log(`Server timeout: ${server.timeout}`);
    server.keepAliveTimeout = 61 * 1000;
    logger.log(`Server keepAliveTimeout: ${server.keepAliveTimeout / 1000}s `);
    server.headersTimeout = 65 * 1000;
    logger.log(`Server headersTimeout: ${server.headersTimeout / 1000}s `);
  });
}
bootstrap();
