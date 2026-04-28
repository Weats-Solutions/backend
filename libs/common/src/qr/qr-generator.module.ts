import { Module } from '@nestjs/common';
import { QrGeneratorService } from './qr-generator.service';

@Module({
  providers: [QrGeneratorService],
  exports: [QrGeneratorService],
})
export class QrGeneratorModule {}
