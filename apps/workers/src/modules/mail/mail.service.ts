import { Inject, Injectable } from "@nestjs/common";
import { TemplateRenderService } from "./template-render.service";
import { HttpService } from "@nestjs/axios";
import { SendEmailDto, EmailTemplate } from "@weats/types";

@Injectable()
export class MailService {
    constructor(
        private readonly templateService: TemplateRenderService,
        private readonly http: HttpService,
        @Inject('ZEPTO_API_URL') private readonly zepToApiUrl: string,
        @Inject('ZEPTO_ZOHO_ENCZAPIKEY') private readonly zepToZohoEnczapikey: string,
        @Inject('ZEPTO_SENDER_EMAIL') private readonly zepToSenderEmail: string,
    ) { }

    async sendEmail(data: SendEmailDto<EmailTemplate>) {
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
            this.zepToApiUrl,
            {
                from: {
                    address: this.zepToSenderEmail,
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
                    Authorization: `Zoho-enczapikey ${this.zepToZohoEnczapikey}`,
                },
            },
        );

        return response.data;
    }
}
