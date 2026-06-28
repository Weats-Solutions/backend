import { Module } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { HttpModule } from '@nestjs/axios';
import { AppConfigService, ConfigsModule } from '@weats/configs';
import { TranslateController } from './translate.controller';

@Module({
    imports: [HttpModule, ConfigsModule],
    controllers: [TranslateController],
    providers: [TranslateService, {
        provide: 'TRANSLATE_API_URL',
        useFactory: (appConfig: AppConfigService) => appConfig.getTranslateApiUrl(),
        inject: [AppConfigService],
    },],
})
export class TranslateModule { }
