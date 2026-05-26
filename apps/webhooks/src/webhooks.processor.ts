import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WebhooksService } from './webhooks.service';
import { ClerkWebhookService } from './clerk/clerk-webhook.service';
import { Stripe } from 'stripe';
import { DiscordService } from '@weats/integrations/discord/discord.service';
import { QUEUES } from '@weats/bull/queues/queues.constants';

@Processor(QUEUES.WEBHOOK)
export class WebhooksProcessor {
  private readonly logger = new Logger(WebhooksProcessor.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly clerkWebhookService: ClerkWebhookService,
    private readonly discordService: DiscordService,
  ) { }

  @Process('stripe-event')
  async handleStripeEvent(job: Job<Stripe.Event>) {
    this.logger.log(`Processing Stripe event: ${job.data.id} (${job.data.type})`);
    try {
      await this.webhooksService.handleStripeWebhook(job.data);
    } catch (error) {
      this.logger.error(`Failed to process Stripe event ${job.data.id}: ${error.message}`);
      throw error; // Repropaga para o Bull tentar novamente (retry)
    }
  }

  @Process('clerk-event')
  async handleClerkEvent(job: Job<any>) {
    this.logger.log(`Processing Clerk event: ${job.data.type}`);
    try {
      await this.clerkWebhookService.handleEvent(job.data);
    } catch (error) {
      this.logger.error(`Failed to process Clerk event: ${error.message}`);
      throw error;
    }
  }

  // Captura erros da fila e envia para o Discord
  @OnQueueFailed()
  async handleFailure(job: Job, error: Error) {
    const attempts = job.opts.attempts ?? 1;
    const isLastAttempt = job.attemptsMade >= attempts;

    if (isLastAttempt) {
      this.logger.error(`[Queue] Job ${job.id} failed definitively: ${error.message}`);

      try {
        await this.discordService.sendEmbed('stripe', {
            title: '🚨 Critical Webhook Error',
            message: `Event **${job.name}** failed after all attempts.`,
            color: 0xff0000,
            fields: [
              {
                name: 'Job ID',
                value: String(job.id),
                inline: true,
              },
              {
                name: 'Event',
                value: job.name,
                inline: true,
              },
              {
                name: 'Error',
                value: error.message,
                inline: false,
              },
              {
                name: 'Payload',
                value: `\`\`\`json\n${JSON.stringify(job.data, null, 2).substring(0, 800)}\n\`\`\``,
                inline: false,
              },
            ],
          });
      } catch (discordError) {
        this.logger.error(`[Queue] Failed to send failure alert to Discord: ${discordError.message}`);
        // Don't throw - notification failure shouldn't affect job failure handling
      }
    } else {
      this.logger.warn(`[Queue] Job ${job.id} failed (attempt ${job.attemptsMade}). Retrying...`);
    }
  }
}
