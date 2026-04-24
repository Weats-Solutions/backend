import { Injectable, Inject } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";

type DiscordEmbedField = {
    name: string;
    value: string;
    inline?: boolean;
};


@Injectable()
export class DiscordService {
    constructor(@Inject('DISCORD_WEBHOOK_URL') private readonly webhookUrl: string, private readonly httpService: HttpService) { }

    async sendToDiscord(
        title: string,
        message: string,
    ): Promise<void> {
        try {

            const payload = {
                embeds: [
                    {
                        title: title,
                        description: message,
                        timestamp: new Date().toISOString(),
                        color: 0x00ff00,
                        fields: [
                            {
                                name: 'Timestamp',
                                value: new Date().toISOString(),
                                inline: true,
                            },
                        ],
                        footer: {
                            text: 'WebHook Service',
                        },
                    },
                ],
            };

            await this.httpService.post(this.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error(
                `Error sending message to Discord via webhook ${this.webhookUrl}: ${error.message}`,
            );
        }
    }

    private async send(payload: any): Promise<void> {
        try {
            await this.httpService.axiosRef.post(this.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error: any) {
            console.error(
                `Discord webhook error: ${error?.message ?? error}`,
            );
        }
    }

    async sendEmbed(params: {
        title: string;
        message: string;
        color?: number;
        fields?: DiscordEmbedField[];
    }): Promise<void> {
        await this.send({
            embeds: [
                {
                    title: params.title,
                    description: params.message,
                    timestamp: new Date().toISOString(),
                    color: params.color ?? 0x00ff00,
                    fields: params.fields ?? [],
                    footer: {
                        text: 'WebHook Service',
                    },
                },
            ],
        });
    }

    async sendJobError(params: {
        jobName: string;
        template?: string;
        error: unknown;
        payload?: unknown;
    }): Promise<void> {
        await this.sendEmbed({
            title: `❌ Job Failed: ${params.jobName}`,
            message:
                typeof params.error === 'string'
                    ? params.error
                    : (params.error as any)?.message ?? 'Unknown error',

            color: 0xff0000,

            fields: [
                {
                    name: 'Template',
                    value: params.template ?? 'N/A',
                    inline: true,
                },
                {
                    name: 'Timestamp',
                    value: new Date().toISOString(),
                    inline: true,
                },
                {
                    name: 'Payload',
                    value: `\`\`\`json\n${JSON.stringify(params.payload ?? {}, null, 2)}\n\`\`\``,
                },
            ],
        });
    }
}

