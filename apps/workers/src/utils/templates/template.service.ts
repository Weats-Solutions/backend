import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class MailTemplateService {
    private templatesCache = new Map<string, Handlebars.TemplateDelegate>();
    private subjectsCache = new Map<string, Record<string, string>>();

    private getTemplatePath(templateName: string, lang: string): string {
        return path.resolve(`./src/templates/${lang}/${templateName}.hbs`);
    }

    private getSubjectsPath(lang: string): string {
        return path.resolve(`./src/templates/${lang}/subjects.json`);
    }


    async renderTemplate<T extends keyof TemplateMap>(
        templateName: T,
        lang: string,
        context: TemplateMap[T],
    ): Promise<string> {
    }

    async renderTemplate(templateName: string, lang: string, context: Record<string, any>): Promise<string> {
        const cacheKey = `${lang}:${templateName}`;
        if (!this.templatesCache.has(cacheKey)) {
            const filePath = this.getTemplatePath(templateName, lang);
            const templateContent = await fs.promises.readFile(filePath, 'utf-8');
            const compiledTemplate = Handlebars.compile(templateContent);
            this.templatesCache.set(cacheKey, compiledTemplate);
        }

        const template = this.templatesCache.get(cacheKey)!;
        const defaultContext = { saasName: "Weats", saasAddress: "https://weats.app" };
        const mergedContext = { ...defaultContext, ...context };
        return template(mergedContext);
    }

    async getSubject(templateName: string, lang = 'en'): Promise<string> {
        const cacheKey = lang;
        if (!this.subjectsCache.has(cacheKey)) {
            try {
                const filePath = this.getSubjectsPath(lang);
                const content = await fs.promises.readFile(filePath, 'utf-8');
                const parsed = JSON.parse(content) as Record<string, string>;
                this.subjectsCache.set(cacheKey, parsed);
            } catch (err) {
                this.subjectsCache.set(cacheKey, {});
            }
        }

        const subjects = this.subjectsCache.get(cacheKey) || {};
        if (subjects[templateName]) return subjects[templateName];
        if (lang !== 'en') {
            const enSubjects = this.subjectsCache.get('en');
            if (!enSubjects) {
                try {
                    const filePath = this.getSubjectsPath('en');
                    const content = await fs.promises.readFile(filePath, 'utf-8');
                    const parsed = JSON.parse(content) as Record<string, string>;
                    this.subjectsCache.set('en', parsed);
                } catch (err) {
                    this.subjectsCache.set('en', {});
                }
            }

            const finalEn = this.subjectsCache.get('en') || {};
            if (finalEn[templateName]) return finalEn[templateName];
        }

        return templateName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
}