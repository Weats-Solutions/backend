import { Injectable, Inject } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";

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
}