import {
    Controller,
    Post,
    Body
} from '@nestjs/common';
import { TranslateService, MultiTargetTranslateResponse } from './translate.service';
import { EstablishmentLanguage } from '@weats/database';

@Controller('translate')
export class TranslateController {
    constructor(private readonly translateService: TranslateService) { }

    @Post()
    async translate(
        @Body() body: {
            texts: string[];
            source: EstablishmentLanguage;
            target?: EstablishmentLanguage;
            targets?: EstablishmentLanguage[];
        } 
    ): Promise<MultiTargetTranslateResponse> {
        const targets = body.targets && Array.isArray(body.targets)
            ? body.targets
            : [body.target || ("EN" as EstablishmentLanguage)];

        return this.translateService.translateMultiTarget(body.texts, body.source, targets);
    }
}
