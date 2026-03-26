import { Module } from '@nestjs/common';
import { TranslateController } from './translate.controller';
import { TranslateService } from '@weats/translate';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    controllers: [TranslateController],
    providers: [TranslateService],
})
export class TranslateModule { }