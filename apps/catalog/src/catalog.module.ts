import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { QrCodeModule } from './qr-code/qr-code.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [QrCodeModule, ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
  })],
  controllers: [CatalogController],
  providers: [CatalogService],
})


export class CatalogModule { }
