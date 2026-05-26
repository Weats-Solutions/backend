import { Injectable, Logger } from '@nestjs/common';
import { Stripe } from 'stripe';
import { CorePrismaService } from '@weats/database';
import { DiscordService } from '@weats/integrations';
import { HandleCustomerService } from './stripe/handle-customer.service';
import { HandleSubscriptionsService } from './stripe/handle-subscriptions.service';
import { HandlePaymentsService } from './stripe/handle-payments.service';

const IDEMPOTENCY_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias
const MAX_PROCESSING_MS = 1000 * 60 * 5; // 5 minutos

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    private readonly discordService: DiscordService,
    private readonly handleCustomerService: HandleCustomerService,
    private readonly handleSubscriptionsService: HandleSubscriptionsService,
    private readonly handlePaymentsService: HandlePaymentsService,
  ) {
    this.logger.log('WebhooksService initialized');
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    this.logger.log(`[Stripe] Event received: ${event.type} [${event.id}]`);

    // ── 1. Idempotency guard ─────────────────────────────────────────────────
    // Upsert atómico: se o evento já existe não faz nada (update: {}).
    const webhookEvent = await this.prisma.webhookEvent.upsert({
      where: { provider_eventId: { provider: 'stripe', eventId: event.id } },
      update: {},
      create: {
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
        status: 'PROCESSING',
        requestId: `stripe-${event.id}-${Date.now()}`,
        processedAt: new Date(),
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      },
    });

    if (webhookEvent.status !== 'PROCESSING') {
      this.logger.warn(
        `[Stripe] Event ${event.id} already processed (status: ${webhookEvent.status}). Skipping.`,
      );
      return;
    }

    // ── 2. Stuck-processing guard ────────────────────────────────────────────
    const processingMs = Date.now() - webhookEvent.processedAt.getTime();
    if (processingMs > MAX_PROCESSING_MS) {
      this.logger.warn(
        `[Stripe] Event ${event.id} stuck in PROCESSING for ${processingMs}ms. Resetting timestamp.`,
      );
      await this.prisma.webhookEvent
        .update({
          where: { id: webhookEvent.id },
          data: { processedAt: new Date() },
        })
        .catch((err: Error) =>
          this.logger.error(`[Stripe] Failed to reset stuck webhook: ${err.message}`),
        );
    }

    // ── 3. Process ───────────────────────────────────────────────────────────
    try {
      // Discord notification — non-blocking, failure não interrompe o processamento
      this.discordService
        .sendEmbed('stripe', {
          title: '📨 Webhook Received',
          message: `Event **${event.type}** is being processed.`,
          color: 0x5865f2,
          fields: [
            { name: 'Event Type', value: event.type, inline: true },
            { name: 'Event ID', value: event.id, inline: true },
          ],
        })
        .catch((err: Error) =>
          this.logger.warn(`[Stripe] Discord notification failed: ${err.message}`),
        );

      await this.dispatch(event);

      // ── 4. Mark as processed ──────────────────────────────────────────────
      await this.prisma.webhookEvent.update({
        where: { provider_eventId: { provider: 'stripe', eventId: event.id } },
        data: { status: 'PROCESSED' },
      });

      this.logger.log(`[Stripe] Event ${event.id} processed successfully`);
    } catch (error) {
      this.logger.error(
        `[Stripe] Failed to process event ${event.id}: ${(error as Error).message}`,
      );

      await this.prisma.webhookEvent
        .update({
          where: { provider_eventId: { provider: 'stripe', eventId: event.id } },
          data: { status: 'FAILED' },
        })
        .catch((dbErr: Error) =>
          this.logger.error(
            `[Stripe] Failed to mark event as FAILED: ${dbErr.message}. ` +
            `Original: ${(error as Error).message}`,
          ),
        );

      throw error;
    }
  }

  // ── Dispatch ───────────────────────────────────────────────────────────────

  private async dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      // Customers
      case 'customer.created':
        return this.handleCustomerService.handleCustomerCreated(event);
      case 'customer.updated':
        return this.handleCustomerService.handleCustomerUpdated(event);
      case 'customer.deleted':
        return this.handleCustomerService.handleCustomerDeleted(event);
      case 'customer.tax_id.updated':
        return this.handleCustomerService.handleTaxIdUpdated(event);

      // Subscriptions
      case 'customer.subscription.created':
        return this.handleSubscriptionsService.handleCustomerSubscriptionCreated(event);
      case 'customer.subscription.updated':
        return this.handleSubscriptionsService.handleCustomerSubscriptionUpdated(event);
      case 'customer.subscription.deleted':
        return this.handleSubscriptionsService.handleCustomerSubscriptionDeleted(event);
      case 'customer.subscription.paused':
        return this.handleSubscriptionsService.handleCustomerSubscriptionPaused(event);
      case 'customer.subscription.resumed':
        return this.handleSubscriptionsService.handleCustomerSubscriptionResumed(event);

      // Invoices
      case 'invoice.paid':
        return this.handlePaymentsService.onInvoicePaid(event);
      case 'invoice.payment_failed':
        return this.handlePaymentsService.onInvoicePaymentFailed(event);

      // Disputes & refunds
      case 'charge.dispute.created':
        return this.handlePaymentsService.onDisputeCreated(event);
      case 'charge.dispute.closed':
        return this.handlePaymentsService.onDisputeClosed(event);
      case 'charge.refunded':
        return this.handlePaymentsService.onChargeRefunded(event);

      default:
        this.logger.debug(`[Stripe] Unhandled event type: ${event.type}`);
    }
  }
}