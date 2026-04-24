import { BullMQConfig } from 'src/config/bullmq.config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SendEmailDto } from './dtos/send-email.dto';
import { DiscordWebhookService } from 'src/shared/webhooks/discord-webhook.service';
import { EmailTemplates } from 'src/templates/templates';
import { MailTemplateService } from 'src/templates/template.service';
import axios from 'axios';
import { ACCEPTED_COUNTRIES } from 'src/config/countries.config';
import { Process, Processor } from '@nestjs/bull';
import { QUEUES } from '@weats/bull';


@Processor(QUEUES.EMAIL)
export class EmailProcessor {
    constructor(
        bullConfig: BullMQConfig,
        private readonly discord: DiscordWebhookService,
        private readonly mailTemplateService: MailTemplateService,
    ) {
        this.worker = new Worker(
            'emails',
            async job => {
                if (job.name === 'send-email') {

                    // Verify job data structure
                    const emailData = plainToInstance(SendEmailDto, job.data);
                    const errors = await validate(emailData);
                    if (errors.length > 0) {
                        await this.discord.sendMessage(
                            `❌ Job de email inválido: ${JSON.stringify(errors)}`
                        )
                        await safeRemove(job, this.discord);
                        return;
                    }

                    // verify template is valid
                    if (!(Object.values(EmailTemplates).includes(emailData.template))) {
                        await this.discord.sendMessage(
                            `❌ Template de email inválido: ${emailData.template}`
                        );
                        await safeRemove(job, this.discord);
                        return;
                    }

                    // Verify lang is valid

                    if (!emailData.lang || !ACCEPTED_COUNTRIES.includes(emailData.lang)) {
                        await this.discord.sendMessage(
                            `❌ Idioma de email inválido: ${emailData.lang}`
                        );
                        await safeRemove(job, this.discord);
                        return;
                    }

                    // Send Email
                    const htmlBody = await this.mailTemplateService.renderTemplate(emailData.template, emailData.lang, emailData.context);
                    const subject = await this.mailTemplateService.getSubject(emailData.template, emailData.lang);

                    try {
                        const response = await axios.post(
                            process.env.ZEPTO_URL!,
                            {
                                from: {
                                    address: process.env.ZEPTO_FROM_EMAIL || 'noreply@weats.pro',
                                },
                                to: [
                                    {
                                        email_address: {
                                            address: emailData.to,
                                            name: emailData.to.split('@')[0],
                                        },
                                    },
                                ],
                                subject: subject,
                                htmlbody: htmlBody,
                            },
                            {
                                headers: {
                                    Accept: 'application/json',
                                    'Content-Type': 'application/json',
                                    Authorization: `Zoho-enczapikey ${process.env.ZEPTO_TOKEN}`,
                                },
                            }
                        );

                        const payload = {
                            type: "Email " + emailData.template + " send.",
                            code: response.data.code,
                            status: response.data.message,
                            request_id: response.data.request_id,
                        }

                        await this.discord.sendMessage(JSON.stringify(payload));
                    } catch (error: any) {
                        if (error instanceof Error) {
                            console.log('❌ Erro ao enviar email:', error.message);
                        } else {
                            console.log('❌ Erro ao enviar email:', JSON.stringify(error, null, 2));
                        }

                    }

                    console.log(`📧 Enviando email para: ${job.data.to}, Assunto: ${subject}`);
                }
            },
            { concurrency: 5, ...bullConfig.getWorkerOptions('emails') },
        );
    }

    
}