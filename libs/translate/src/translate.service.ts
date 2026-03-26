import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { EstablishmentLanguage } from "@prisma/client";
import { lastValueFrom } from "rxjs";

@Injectable()
export class TranslateService {
    private readonly translateUrl = 'https://translate.weats.pro/translate';

    constructor(
        private readonly httpService: HttpService
    ) { }

    async translate(
        texts: string[],
        source: EstablishmentLanguage,
        target: EstablishmentLanguage
    ): Promise<{ source: EstablishmentLanguage, target: EstablishmentLanguage, translations: string[] }> {
        try {
            const response = await lastValueFrom(
                this.httpService.post(this.translateUrl, {
                    q: texts,
                    source,
                    target
                })
            );

            return {
                source,
                target,
                translations: response.data.translatedText
            };
        } catch (error) {
            console.error('Error translating text:', error);
            throw error;
        }
    }
}
