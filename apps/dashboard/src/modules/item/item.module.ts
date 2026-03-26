import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { AddonController } from './addon/addon.controller';
import { AddonService } from './addon/addon.service';

@Module({
    imports: [
        DatabaseModule,
    ],
    controllers: [AddonController, ItemController],
    providers: [
        AddonService,
        ItemService,
    ],
})
export class ItemModule { }
