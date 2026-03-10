import { Module } from '@nestjs/common';
import { CorePrismaService } from './core-prisma.service';
import { OrdersPrismaService } from './orders-prisma.service';

@Module({
  providers: [CorePrismaService, OrdersPrismaService],
  exports: [CorePrismaService, OrdersPrismaService],
})
export class DatabaseModule {}
