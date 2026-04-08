import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { LandingpageController } from './landingpage.controller';
import { LandingpageService } from './landingpage.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigsModule } from '@weats/configs';
import { MenuModule } from '../menu/menu.module';
import { MenuUtilsModule } from '@weats/common/utils/modules/menu/menu-utils.module';

@Module({
    imports: [
        DatabaseModule,
        HttpModule,
        ConfigsModule,
        MenuModule,
        MenuUtilsModule
    ],
    controllers: [LandingpageController],
    providers: [
        LandingpageService,
    ],
    exports: [LandingpageService],
})
export class LandingpageModule { }
