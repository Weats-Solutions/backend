import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceExceptionFilter } from './common/filters/microservice-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new MicroserviceExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
