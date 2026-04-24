// queues.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigsModule } from '@weats/configs';
import { RedisConfigService } from '@weats/configs/redis-config.service';
import { bullConfigFactory } from './config/bull.config';
import { QUEUES } from './queues/queues.constants';
import { ConfigModule } from '@nestjs/config';
import { EmailProducer } from './producers/email.producer';

@Module({
  imports: [
    ConfigModule,
    ConfigsModule,
    BullModule.forRootAsync({
      imports: [ConfigsModule],
      inject: [RedisConfigService],
      useFactory: bullConfigFactory,
    }),

    BullModule.registerQueue(
      {
        name: QUEUES.EMAIL, limiter: {
          max: 10,
          duration: 1000,
        }
      },
      { name: QUEUES.IMAGE },
      { name: QUEUES.QRCODE },
      { name: QUEUES.WEBHOOK },
      { name: QUEUES.LANGUAGES },
    ),
  ],
  providers: [EmailProducer],
  exports: [BullModule, EmailProducer],
})
export class QueuesModule { }
