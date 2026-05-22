import {
    Controller,
    Post,
    Body
} from '@nestjs/common';
import { TranslateService } from './translate.service';
import { EstablishmentLanguage } from '@weats/database';

@Controller('translate')
export class TranslateController {
    constructor(private readonly translateService: TranslateService) { }

    @Post()
    async translate(@Body() body: { texts: string[], source: EstablishmentLanguage, target: EstablishmentLanguage }): Promise<{ source: EstablishmentLanguage, target: EstablishmentLanguage, translations: string[] }> {
        return this.translateService.translate(body.texts, body.source, body.target);
    }

}
