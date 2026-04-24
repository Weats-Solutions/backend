import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { DiscordService } from "@weats/integrations";
import { QUEUES } from "@weats/bull";
import { MailService } from "./mail.service";
import { SendEmailDto, EmailTemplate } from "@weats/types";

@Processor(QUEUES.EMAIL)
export class MailProcessor {
    constructor(
        private readonly emailService: MailService,
        private readonly discord: DiscordService,
    ) { }

    @Process('send-email')
    async handleSendEmail(job: Job<SendEmailDto<EmailTemplate>>) {
        try {
            const result = await this.emailService.sendEmail(job.data);

            await this.discord.sendEmbed({
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

            console.log(`📧 Email sent to: ${job.data.to}`);
        } catch (error) {
            await this.handleJobError(job, error);
        }
    }

    private async handleJobError(job: Job<SendEmailDto<EmailTemplate>>, error: any) {
        console.error('❌ Email job failed:', error);

        await this.discord.sendJobError({
            jobName: 'send-email',
            template: job.data.template,
            error: error,
            payload: job.data,
        });

        throw error;
    }

}
