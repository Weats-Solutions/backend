import { Module } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { HttpModule } from '@nestjs/axios';
import { AppConfigService, ConfigsModule } from '@weats/configs';

@Module({
  imports: [HttpModule, ConfigsModule],
  providers: [TranslateService, {
    provide: 'TRANSLATE_API_URL',
    useFactory: (appConfig: AppConfigService) => appConfig.getTranslateApiUrl(),
    inject: [AppConfigService],
  },],
  exports: [TranslateService],
})
export class TranslateModule { }
