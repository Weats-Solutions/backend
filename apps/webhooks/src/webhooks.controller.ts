import { Controller, Get } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { WEBHOOK_PATTERNS } from '@weats/common/patterns/webhook.patterns';
import { Stripe } from 'stripe';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUES } from '@weats/bull/queues/queues.constants';

@Controller()
export class WebhooksController {
  constructor(
    @InjectQueue(QUEUES.WEBHOOK) private readonly webhooksQueue: Queue
  ) { }

  @EventPattern(WEBHOOK_PATTERNS.STRIPE_WEBHOOK)
  async handleStripeWebhook(event: Stripe.Event) {
    // Adiciona o evento para processamento em background com retries
    await this.webhooksQueue.add('stripe-event', event, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      timeout: 60000,
      removeOnComplete: true,
    });
  }

  @EventPattern(WEBHOOK_PATTERNS.CLERK_WEBHOOK)
  async handleClerkWebhook(event: any) {
    await this.webhooksQueue.add('clerk-event', event, {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
      timeout: 30000,
      removeOnComplete: true,
    });
  }
}
