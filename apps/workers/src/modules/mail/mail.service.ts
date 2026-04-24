import { Injectable } from "@nestjs/common";
import { TemplateRenderService } from "./template-render.service";
import { HttpService } from "@nestjs/axios";
import { SendEmailDto, EmailTemplate } from "@weats/types";

@Injectable()
export class MailService {
    constructor(
        private readonly templateService: TemplateRenderService,
        private readonly http: HttpService,
    ) { }

    async sendEmail(data: SendEmailDto<EmailTemplate>) {
        // 1. render template (já validado com Zod dentro do service)
        const html = await this.templateService.renderTemplate(
            data.template,
            data.lang,
            data.context,
        );

        // 2. subject (já com fallback dentro do service)
        const subject = await this.templateService.getSubject(
            data.template,
            data.lang,
        );

        // 3. send email (isolado)
        const response = await this.http.axiosRef.post(
            process.env.ZEPTO_URL!,
            {
                from: {
                    address: process.env.ZEPTO_FROM_EMAIL || 'noreply@weats.pro',
                },
                to: [
                    {
                        email_address: {
                            address: data.to,
                            name: data.to.split('@')[0],
                        },
                    },
                ],
                subject,
                htmlbody: html,
            },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Zoho-enczapikey ${process.env.ZEPTO_TOKEN}`,
                },
            },
        );

        return response.data;
    }
}
