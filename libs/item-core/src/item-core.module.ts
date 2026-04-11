import { Module } from '@nestjs/common';
import { ItemCoreService } from './item-core.service';

@Module({
  providers: [ItemCoreService],
  exports: [ItemCoreService],
})
export class ItemCoreModule {}
