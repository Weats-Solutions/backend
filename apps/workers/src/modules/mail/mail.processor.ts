import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { DiscordService } from "@weats/integrations";
import { QUEUES } from "@weats/bull";
import { MailService } from "./mail.service";
import { SendEmailDto, EmailTemplate } from "@weats/types";
import { UnrecoverableJobError } from "@weats/common";
import { Logger } from "@nestjs/common";


@Processor(QUEUES.EMAIL)
export class MailProcessor {
    private readonly logger = new Logger(MailProcessor.name);

    constructor(
        private readonly emailService: MailService,
        private readonly discord: DiscordService,
    ) { }

    @Process('send-email')
    async handleSendEmail(job: Job<SendEmailDto<EmailTemplate>>) {
        try {
            const result = await this.emailService.sendEmail(job.data);


            await this.discord.sendEmbed('email', {
                title: `Email ${job.data.template} sent`,
                message: `Request ID: ${result.request_id}`,
                color: 0x00ff00,
                fields: [
                    {
                        name: 'To',
                        value: job.data.to,
                        inline: true,
                    },
                    {
                        name: 'Template',
                        value: job.data.template,
                        inline: true,
                    },
                    {
                        name: 'Request ID',
                        value: result.request_id,
                        inline: true,
                    },
                ],
            });


            this.logger.log(`[Mail] Email sent to: ${job.data.to}`);
        } catch (error) {
            if (error instanceof UnrecoverableJobError) {
                this.logger.error(`[Mail] Unrecoverable error: ${error.message}. Skipping retries.`);

                // Opcional: Avisamos o Discord que o erro não tem retry
                await this.discord.sendEmbed('email', {
                    title: `Email Unrecoverable error`,
                    message: `Job stopped for template **${job.data.template}** because it's missing.\nError: ${error.message}`,
                    color: 0xff0000,
                    fields: [
                        {
                            name: 'To',
                            value: job.data.to,
                            inline: true,
                        },
                        {
                            name: 'Template',
                            value: job.data.template,
                            inline: true,
                        },
                    ],
                });

                return; // 👈 NÃO lançamos o erro, o job termina aqui como concluído
            }

            await this.handleJobError(job, error);
        }
    }

    private async handleJobError(job: Job<SendEmailDto<EmailTemplate>>, error: any) {
        this.logger.error(`[Mail] Email job failed: ${error.message}`);

        await this.discord.sendJobError('email', {
            jobName: 'send-email',
            template: job.data.template,
            error: error,
            payload: job.data,
        });

        throw error;
    }

}
