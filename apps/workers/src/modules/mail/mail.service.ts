import { Injectable, Logger } from "@nestjs/common";
import { TemplateRenderService } from "./template-render.service";
import { HttpService } from "@nestjs/axios";
import { SendEmailDto, EmailTemplate } from "@weats/types";
import { AppConfigService, ZeptoConfigService, ResendConfigService } from "@weats/configs";

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly templateService: TemplateRenderService,
        private readonly http: HttpService,
        private readonly appConfig: AppConfigService,
        private readonly zeptoConfig: ZeptoConfigService,
        private readonly resendConfig: ResendConfigService,
    ) { }

    async sendEmail(data: SendEmailDto<EmailTemplate>) {
        const sendMail = this.appConfig.getSendMail();
        if (!sendMail) {
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

        const provider = this.appConfig.getMailProvider();
        this.logger.log(`[Mail] Sending email to ${data.to} via provider: ${provider}`);

        if (provider === 'resend') {
            const apiKey = this.resendConfig.getResendApiKey();
            const senderEmail = this.resendConfig.getSenderEmail();

            const response = await this.http.axiosRef.post(
                'https://api.resend.com/emails',
                {
                    from: senderEmail,
                    to: [data.to],
                    subject,
                    html,
                    ...(data.attachments && {
                        attachments: data.attachments.map(a => ({
                            content: a.content,
                            filename: a.name,
                        }))
                    }),
                },
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                },
            );

            this.logger.debug(`[Mail] Resend response: ${JSON.stringify(response.data)}`);
            return response.data;
        } else {
            const apiUrl = this.zeptoConfig.getZeptoApiUrl();
            const apiKey = this.zeptoConfig.getZeptoENCZAPIKEY();
            const senderEmail = this.zeptoConfig.getSenderEmail();

            const response = await this.http.axiosRef.post(
                apiUrl,
                {
                    from: {
                        address: senderEmail,
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
                        Authorization: `Zoho-enczapikey ${apiKey}`,
                    },
                },
            );

            this.logger.debug(`[Mail] Zepto response: ${JSON.stringify(response.data)}`);
            return response.data;
        }
    }
}
