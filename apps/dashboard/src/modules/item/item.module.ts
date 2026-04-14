import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { AddonController } from './addon/addon.controller';
import { AddonService } from './addon/addon.service';
import { VariantOptionsController } from './variant/variant-options.controller';
import { VariantOptionsService } from './variant/variant-options.service';
import { MenuUtilsModule } from '@weats/common/utils/modules/menu/menu-utils.module';

@Module({
    imports: [
        DatabaseModule,
        MenuUtilsModule,
    ],
    controllers: [ItemController, VariantOptionsController, AddonController],
    providers: [
        AddonService,
        ItemService,
        VariantOptionsService,
    ],
})
export class ItemModule { }
