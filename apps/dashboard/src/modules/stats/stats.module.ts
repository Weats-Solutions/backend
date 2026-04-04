import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
