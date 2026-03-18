import { Module } from '@nestjs/common';
import { DatabaseModule } from '@weats/database';
import { LandingpageController } from './landingpage.controller';
import { LandingpageService } from './landingpage.service';

@Module({
    imports: [
        DatabaseModule,
    ],
    controllers: [LandingpageController],
    providers: [
        LandingpageService,
    ],
    exports: [LandingpageService],
})
export class LandingpageModule { }
