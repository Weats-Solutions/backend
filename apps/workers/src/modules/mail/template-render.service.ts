import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { ZodSchema } from 'zod';
import { EmailTemplate, TemplateMap, ACCEPTED_LANGUAGES } from '@weats/types';
import { UnrecoverableJobError } from '@weats/common';
import { EmailTemplateConfigs } from './validators';
import { SUBJECTS } from './subjects';

const LANG_FALLBACKS = ['en'] as const;

export type SubjectKey = EmailTemplate | string;

@Injectable()
export class TemplateRenderService {
    private templatesCache = new Map<string, Handlebars.TemplateDelegate>();

    private basePath = path.resolve(process.cwd(), 'apps/workers/src/modules/mail/templates');

    // -----------------------------
    // TEMPLATE PATH
    // -----------------------------
    private getTemplatePath(template: EmailTemplate, lang: ACCEPTED_LANGUAGES) {
        const config = EmailTemplateConfigs[template];
        const category = config?.category;
        
        if (category) {
            return path.join(this.basePath, lang, category, `${template}.hbs`);
        }

        return path.join(this.basePath, lang, `${template}.hbs`);
    }

    // -----------------------------
    // LOAD TEMPLATE (with fallback)
    // -----------------------------
    private async loadTemplateWithFallback(
        template: EmailTemplate,
        lang: ACCEPTED_LANGUAGES,
    ): Promise<{ compiled: Handlebars.TemplateDelegate; usedLang: string }> {
        const languagesToTry = [lang, ...LANG_FALLBACKS];

        for (const l of languagesToTry) {
            const cacheKey = `${l}:${template}`;

            const cached = this.templatesCache.get(cacheKey);
            if (cached) {
                return { compiled: cached, usedLang: l };
            }

            try {
                const filePath = this.getTemplatePath(template, l);

                if (!fs.existsSync(filePath)) {
                    console.warn(`Template file not found at: ${filePath}`);
                    continue;
                }

                const templateContent = await fs.promises.readFile(filePath, 'utf-8');
                const compiled = Handlebars.compile(templateContent);
                this.templatesCache.set(cacheKey, compiled);

                return { compiled, usedLang: l };
            } catch (err) {
                console.error(`Error loading template at ${this.getTemplatePath(template, l)}:`, err);
                continue;
            }
        }

        throw new UnrecoverableJobError(
            `Template "${template}" not found for languages: ${languagesToTry.join(', ')}`,
        );
    }

    // -----------------------------
    // ZOD VALIDATION
    // -----------------------------
    private validateContext<T extends EmailTemplate>(
        template: T,
        context: unknown,
    ): TemplateMap[T] {
        const schema = EmailTemplateConfigs[template].schema as ZodSchema<TemplateMap[T]>;
        return schema.parse(context);
    }

    // -----------------------------
    // SUBJECT (with fallback)
    // -----------------------------
    async getSubject(
        template: SubjectKey,
        lang: ACCEPTED_LANGUAGES,
    ): Promise<string> {
        const langsToTry: ACCEPTED_LANGUAGES[] = [lang, 'en'];

        for (const l of langsToTry) {
            const subjects = SUBJECTS[l];

            if (subjects?.[template]) {
                return subjects[template];
            }
        }

        // final safe fallback
        return template
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // -----------------------------
    // MAIN RENDER
    // -----------------------------
    async renderTemplate<T extends EmailTemplate>(
        emailTemplate: T,
        lang: ACCEPTED_LANGUAGES,
        context: TemplateMap[T],
    ): Promise<string> {
        // 1. validate context (Zod)
        const validatedContext = this.validateContext(emailTemplate, context);

        // 2. load template with fallback
        const { compiled } = await this.loadTemplateWithFallback(
            emailTemplate,
            lang,
        );

        // 3. inject global context + merge safe data
        const finalContext = {
            saasName: 'Weats',
            saasAddress: 'https://weats.app',
            ...validatedContext,
        };

        // 4. render
        return compiled(finalContext);
    }
}
