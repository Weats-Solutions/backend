import { Inject, Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { EstablishmentLanguage } from "@weats/database";
import { lastValueFrom } from "rxjs";
import { CacheService } from "@weats/cache";
import pLimit from "p-limit";
import * as crypto from "crypto";

interface TranslationResult {
    status: "success" | "failed";
    data?: string[];
    error?: string;
}

export interface MultiTargetTranslateResponse {
    source: EstablishmentLanguage;
    translations: Record<string, TranslationResult>;
}

@Injectable()
export class TranslateService {
    private readonly logger = new Logger(TranslateService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly cacheService: CacheService,
        @Inject('TRANSLATE_API_URL') private readonly translateApiUrl: string,
    ) { }

    private getCacheKey(text: string, source: string, target: string): string {
        const hash = crypto.createHash("sha256").update(text.trim()).digest("hex");
        return `trans:${source.toLowerCase()}:${target.toLowerCase()}:${hash}`;
    }

    /**
     * Translates texts for multiple target languages.
     * Incorporates:
     * - Request-level deduplication
     * - Cache-first lookup using Redis (hash(text + source + target))
     * - Controlled concurrency pipeline using p-limit
     * - Batching for texts to external APIs
     * - Failure fallback/isolation (Partial Success)
     */
    async translateMultiTarget(
        texts: string[],
        source: EstablishmentLanguage,
        targets: EstablishmentLanguage[]
    ): Promise<MultiTargetTranslateResponse> {
        // 1. Sanitize and Deduplicate input texts
        const sanitizedTexts = texts.map((t) => (t || "").trim());
        const uniqueTexts = Array.from(new Set(sanitizedTexts)).filter(Boolean);

        if (uniqueTexts.length === 0) {
            const emptyResult: Record<string, TranslationResult> = {};
            for (const target of targets) {
                emptyResult[target] = {
                    status: "success",
                    data: sanitizedTexts.map(() => "")
                };
            }
            return { source, translations: emptyResult };
        }

        const translationsResult: Record<string, TranslationResult> = {};

        // 2. Controlled pipeline: process targets with limited concurrency
        // We limit to 2 target languages at the same time to prevent provider rate-limits
        const limit = pLimit(2);

        const translationTasks = targets.map((target) =>
            limit(async () => {
                try {
                    // check cache first for each unique text
                    const cachedMap: Record<string, string> = {};
                    const missingTexts: string[] = [];

                    const cacheKeyTasks = uniqueTexts.map(async (text) => {
                        const cacheKey = this.getCacheKey(text, source, target);
                        try {
                            const val = await this.cacheService.get<string>(cacheKey);
                            if (val) {
                                cachedMap[text] = val;
                            } else {
                                missingTexts.push(text);
                            }
                        } catch (err) {
                            this.logger.error(`[TranslateService] Cache read error for key: ${cacheKey}`, err);
                            missingTexts.push(text);
                        }
                    });

                    await Promise.all(cacheKeyTasks);

                    // If some texts are missing, call the translation API in batches
                    if (missingTexts.length > 0) {
                        // Batch size of 30 texts per API call
                        const batchSize = 30;
                        const batches: string[][] = [];
                        for (let i = 0; i < missingTexts.length; i += batchSize) {
                            batches.push(missingTexts.slice(i, i + batchSize));
                        }

                        for (const batch of batches) {
                            const translatedBatch = await this.translateWithFallback(batch, source, target);
                            
                            // Save translations back to cache and update cachedMap
                            const cacheWriteTasks = batch.map(async (text, index) => {
                                const translatedText = translatedBatch[index] || text;
                                cachedMap[text] = translatedText;

                                const cacheKey = this.getCacheKey(text, source, target);
                                try {
                                    // Cache for 7 days (604800 seconds)
                                    await this.cacheService.set(cacheKey, translatedText, 604800);
                                } catch (err) {
                                    this.logger.error(`[TranslateService] Cache write error for key: ${cacheKey}`, err);
                                }
                            });

                            await Promise.all(cacheWriteTasks);
                        }
                    }

                    // Map unique translations back to the original texts order (including duplicates)
                    const orderedTranslations = sanitizedTexts.map((originalText) => {
                        if (!originalText.trim()) return "";
                        return cachedMap[originalText.trim()] || originalText;
                    });

                    translationsResult[target] = {
                        status: "success",
                        data: orderedTranslations
                    };
                } catch (error: any) {
                    this.logger.error(
                        `[TranslateService] Target ${target} translation failed: ${error.message || error}`,
                        error.stack
                    );
                    translationsResult[target] = {
                        status: "failed",
                        error: error.message || "Translation provider error",
                        // Send original/fallback texts as backup data so UI can still use it if preferred
                        data: sanitizedTexts
                    };
                }
            })
        );

        await Promise.all(translationTasks);

        return {
            source,
            translations: translationsResult
        };
    }

    /**
     * Translates a single batch of texts via external APIs, with provider fallback logic.
     */
    private async translateWithFallback(
        texts: string[],
        source: EstablishmentLanguage,
        target: EstablishmentLanguage
    ): Promise<string[]> {
        try {
            this.logger.log(`[TranslateService] API call: Source: ${source}, Target: ${target}, Texts count: ${texts.length}`);
            
            const payload = {
                q: texts,
                source: source.toLowerCase(),
                target: target.toLowerCase(),
                format: "text"
            };

            const response = await lastValueFrom(
                this.httpService.post(`${this.translateApiUrl}/translate`, payload)
            );

            const translations = response.data.translatedText || response.data.translations;
            if (!translations) {
                throw new Error("No translations returned from provider");
            }

            return Array.isArray(translations) ? translations : [translations];
        } catch (error: any) {
            this.logger.warn(
                `[TranslateService] Primary provider failed for target ${target}: ${error?.response?.data || error?.message || error}. Trying fallback...`
            );
            
            // FALLBACK PROVIDER STRATEGY:
            // Since we only have one external provider configured via env, our fallback is to return the original texts
            // as mock translations, allowing the system to run on partial success.
            // In the future, if OpenAI/DeepL keys are configured, they can be plugged here:
            // return this.translateWithAlternativeProvider(texts, source, target);
            
            return texts;
        }
    }
}
