import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from './redis-io.adapter';
import { RedisConfigService } from '@weats/configs/redis-config.service';
import { Logger, ValidationError } from '@nestjs/common';
import { AppConfigService, getCorsOptions } from '@weats/configs';
import { RealtimeModule } from './realtime.module';

async function bootstrap() {
  const app = await NestFactory.create(RealtimeModule);
  const appConfigService = app.get(AppConfigService);
  const apiPort = appConfigService.getRealtimePort();
  const nodeEnv = appConfigService.getNodeEnv();

  app.enableCors(getCorsOptions(appConfigService));


  const logger = new Logger('Realtime');

  const server = app.getHttpServer();

  const redisConfigService = app.get(RedisConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, redisConfigService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.enableShutdownHooks();

  await app.listen(apiPort, '0.0.0.0', () => {
    logger.log(`🚀 Servidor pronto em porta ${apiPort} - Ambiente: ${nodeEnv}`);
    logger.log(`Server keepAliveTimeout: ${server.keepAliveTimeout / 1000}s `);
    logger.log(`Server headersTimeout: ${server.headersTimeout / 1000}s `);
  });
}
bootstrap();

