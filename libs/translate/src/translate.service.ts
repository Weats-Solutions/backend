import { Inject, Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { EstablishmentLanguage } from "@weats/database";
import { lastValueFrom } from "rxjs";

@Injectable()
export class TranslateService {

    constructor(
        private readonly httpService: HttpService,
        @Inject('TRANSLATE_API_URL') private readonly translateApiUrl: string,
    ) { }

    async translate(
        texts: string[],
        source: EstablishmentLanguage,
        target: EstablishmentLanguage
    ): Promise<{ source: EstablishmentLanguage, target: EstablishmentLanguage, translations: string[] }> {
        try {
            console.log(`[TranslateService Request] Source: ${source}, Target: ${target}`);
            console.log(`[TranslateService Request] Texts:`, texts);

            const payload = {
                q: texts,
                source: source.toLowerCase(),
                target: target.toLowerCase(),
                format: "text"
            };

            const response = await lastValueFrom(
                this.httpService.post(`${this.translateApiUrl}/translate`, payload)
            );

            console.log(`[TranslateService Response Status]:`, response.status);
            console.log(`[TranslateService Raw Response Data]:`, JSON.stringify(response.data));

            // Adjust this based on what LibreTranslate or your provider responds:
            // Usually LibreTranslate responds with { translatedText: [...] }
            const translations = response.data.translatedText || response.data.translations;

            return {
                source,
                target,
                translations: Array.isArray(translations) ? translations : [translations]
            };
        } catch (error: any) {
            console.error('[TranslateService Error]:', error?.response?.data || error);
            throw error;
        }
    }
}
