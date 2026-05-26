import { Inject, Injectable, Logger } from "@nestjs/common";
import { TemplateRenderService } from "./template-render.service";
import { HttpService } from "@nestjs/axios";
import { SendEmailDto, EmailTemplate } from "@weats/types";

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly templateService: TemplateRenderService,
        private readonly http: HttpService,
        @Inject('ZEPTO_API_URL') private readonly zepToApiUrl: string,
        @Inject('ZEPTO_ZOHO_ENCZAPIKEY') private readonly zepToZohoEnczapikey: string,
        @Inject('ZEPTO_SENDER_EMAIL') private readonly zepToSenderEmail: string,
        @Inject('SEND_MAIL') private readonly sendMail: boolean,
    ) { }

    async sendEmail(data: SendEmailDto<EmailTemplate>) {
        if (!this.sendMail) {
            this.logger.log(
                `[Mail] SEND_MAIL is false. Skipping email to ${data.to} (Template: ${data.template})`
            );
            return { request_id: 'skipped-send-mail-disabled' };
        }

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
                ...(data.attachments && {
                    attachments: data.attachments.map(a => ({
                        content: a.content,
                        name: a.name,
                        mime_type: a.contentType,
                    }))
                }),
            },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Zoho-enczapikey ${this.zepToZohoEnczapikey}`,
                },
            },
        );

        this.logger.debug(JSON.stringify(response));

        return response.data;
    }
}
