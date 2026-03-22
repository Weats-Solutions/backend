import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { LandingpageController } from './landingpage.controller';
import { LandingpageService } from './landingpage.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigsModule } from '@weats/configs';

@Module({
    imports: [
        DatabaseModule,
        HttpModule,
        ConfigsModule,
    ],
    controllers: [LandingpageController],
    providers: [
        LandingpageService,
    ],
    exports: [LandingpageService],
})
export class LandingpageModule { }
