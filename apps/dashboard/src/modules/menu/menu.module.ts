import { Module } from '@nestjs/common';
import { IntegrationsModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';

import { FeatureUsageModule } from '@weats/common/feature/feature-usage.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuCategoryController } from './category/category.controller';
import { MenuCategoryService } from './category/category.service';
import { MenuSubcategoryController } from './subcategory/subcategory.controller';
import { MenuSubcategoryService } from './subcategory/subcategory.service';

@Module({
    imports: [
        DatabaseModule,
        IntegrationsModule,
        FeatureUsageModule
    ],
    controllers: [MenuController, MenuCategoryController, MenuSubcategoryController],
    providers: [
        MenuService,
        MenuCategoryService,
        MenuSubcategoryService,
    ],
    exports: [
        MenuService,
        MenuCategoryService,
        MenuSubcategoryService,
    ],
})
export class MenuModule { }
