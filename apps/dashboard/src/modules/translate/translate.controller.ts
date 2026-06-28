import {
    Controller,
    Post,
    Body
} from '@nestjs/common';
import { TranslateService, MultiTargetTranslateResponse } from './translate.service';
import { EstablishmentLanguage } from '@weats/database';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Translate')
@Controller('translate')
export class TranslateController {
    constructor(private readonly translateService: TranslateService) { }

    @Post()
    @ApiOperation({ summary: 'Traduzir textos para um ou mais idiomas' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                texts: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lista de textos a traduzir',
                    example: ['Olá', 'Mundo'],
                },
                source: {
                    type: 'string',
                    description: 'Idioma de origem',
                    example: 'PT',
                },
                target: {
                    type: 'string',
                    description: 'Idioma de destino único (opcional se targets for fornecido)',
                    example: 'EN',
                },
                targets: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lista de idiomas de destino (opcional se target for fornecido)',
                    example: ['EN', 'ES'],
                },
            },
            required: ['texts', 'source'],
        },
    })
    @ApiOkResponse({ description: 'Textos traduzidos com sucesso' })
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
