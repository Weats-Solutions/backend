import { Module } from '@nestjs/common';
import { MailModule } from './modules/mail/mail.module';
import { ConfigModule } from '@nestjs/config';

import { QrCodeWorkerModule } from './modules/qr-code/qr-code-worker.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    MailModule,
    QrCodeWorkerModule
  ],
  controllers: [],
  providers: [],
})
export class WorkersModule { }
