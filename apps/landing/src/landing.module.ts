import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigsModule } from '@weats/configs';
import { DatabaseModule } from '@weats/database';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ConfigsModule,
    DatabaseModule,
  ],
  controllers: [LandingController],
  providers: [LandingService],
})
export class LandingModule {}
