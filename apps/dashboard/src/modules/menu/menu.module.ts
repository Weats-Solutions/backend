import { Module } from '@nestjs/common';
import { IntegrationsModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';

import { FeatureUsageModule } from '@weats/common/feature/feature-usage.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
    imports: [
        DatabaseModule,
        IntegrationsModule,
        FeatureUsageModule
    ],
    controllers: [MenuController],
    providers: [
        MenuService,
    ],
})
export class MenuModule { }
