import { NestFactory } from '@nestjs/core';
import { RealtimeModule } from './realtime.module';
import { RedisIoAdapter } from './redis-io.adapter';
import { RedisConfigService } from '@weats/configs/redis-config.service';

async function bootstrap() {
  const app = await NestFactory.create(RealtimeModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const redisConfigService = app.get(RedisConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, redisConfigService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(4005);
}
bootstrap();
