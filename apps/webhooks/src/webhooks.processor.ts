import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WebhooksService } from './webhooks.service';
import { ClerkWebhookService } from './clerk/clerk-webhook.service';
import { Stripe } from 'stripe';
import { DiscordService } from '@weats/integrations/discord/discord.service';

@Processor('webhooks-queue')
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
      this.logger.error(`❌ Job ${job.id} falhou definitivamente: ${error.message}`);

      await this.discordService.sendToDiscord(
        '🚨 ERRO CRÍTICO NO WEBHOOK',
        `O evento **${job.name}** falhou após todas as tentativas.\n\n` +
        `**Job ID:** ${job.id}\n` +
        `**Erro:** ${error.message}\n` +
        `**Payload:** \`\`\`json\n${JSON.stringify(job.data, null, 2).substring(0, 1000)}\n\`\`\``
      );
    } else {
      this.logger.warn(`⚠️ Job ${job.id} falhou (tentativa ${job.attemptsMade}). Retentando...`);
    }
  }
}
