import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { DiscordConfigService, DiscordWebhookType } from "@weats/configs";

type DiscordEmbedField = {
    name: string;
    value: string;
    inline?: boolean;
};

@Injectable()
export class DiscordService {
    constructor(
        private readonly discordConfigService: DiscordConfigService,
        private readonly httpService: HttpService,
    ) { }

    private getWebhookUrl(type: DiscordWebhookType): string {
        return this.discordConfigService.getWebhookUrl(type);
    }

    private async send(webhookType: DiscordWebhookType, payload: any): Promise<void> {
        const webhookUrl = this.getWebhookUrl(webhookType);
        try {
            await this.httpService.axiosRef.post(webhookUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error(`Discord webhook error [${webhookType}]: ${error?.message ?? error}`);
        }
    }

    async sendEmbed(webhookType: DiscordWebhookType, params: {
        title: string;
        message: string;
        color?: number;
        fields?: DiscordEmbedField[];
    }): Promise<void> {
        await this.send(webhookType, {
            embeds: [
                {
                    title: params.title,
                    description: params.message,
                    timestamp: new Date().toISOString(),
                    color: params.color ?? 0x00ff00,
                    fields: params.fields ?? [],
                    footer: { text: 'WebHook Service' },
                },
            ],
        });
    }

    async sendJobError(webhookType: DiscordWebhookType, params: {
        jobName: string;
        template?: string;
        error: unknown;
        payload?: unknown;
    }): Promise<void> {
        await this.sendEmbed(webhookType, {
            title: `❌ Job Failed: ${params.jobName}`,
            message:
                typeof params.error === 'string'
                    ? params.error
                    : (params.error as any)?.message ?? 'Unknown error',
            color: 0xff0000,
            fields: [
                { name: 'Template', value: params.template ?? 'N/A', inline: true },
                { name: 'Timestamp', value: new Date().toISOString(), inline: true },
                {
                    name: 'Payload',
                    value: `\`\`\`json\n${JSON.stringify(params.payload ?? {}, null, 2)}\n\`\`\``,
                },
            ],
        });
    }
}