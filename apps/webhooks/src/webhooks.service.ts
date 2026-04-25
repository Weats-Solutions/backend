import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { HandleCustomerService } from './stripe/handle-customer.service';
import { HandleSubscriptionsService } from './stripe/handle-subscriptions.service';
import { HandlePaymentsService } from './stripe/handle-payments.service';
import { DiscordService } from '@weats/integrations/discord/discord.service';
import { CorePrismaService } from '@weats/database';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly stripe: Stripe,
    private readonly handleCustomerService: HandleCustomerService,
    private readonly handleSubscriptionsService: HandleSubscriptionsService,
    private readonly handlePaymentsService: HandlePaymentsService,
    private readonly discordService: DiscordService,
    private readonly prisma: CorePrismaService,
  ) {
    this.logger.log('Service initialized');
  }

  async handleStripeWebhook(event: Stripe.Event) {
    const requestId = `stripe-${event.id}-${Date.now()}`;
    
    this.logger.log(`[Stripe] Checking idempotency for event: ${event.id} (requestId: ${requestId})`);

    // 1. Usar UPSERT atomicamente para evitar race condition
    // Se evento já existe com mesmo eventId, não faz nada (apenas retorna)
    // Se não existe, cria com status PROCESSING
    const webhookEvent = await this.prisma.webhookEvent.upsert({
      where: {
        provider_eventId: {
          provider: 'stripe',
          eventId: event.id,
        },
      },
      update: {}, // Não atualiza se já existe
      create: {
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
        status: 'PROCESSING',
        requestId: requestId,
        processedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // Expira em 7 dias
      },
    });

    // 2. Verificar se foi recém-criado ou já existia
    // Se status não for PROCESSING (já foi processado), skip
    if (webhookEvent.status !== 'PROCESSING') {
      this.logger.warn(`[Stripe] Event ${event.id} already processed (status: ${webhookEvent.status}). Skipping.`);
      return;
    }

    // 3. Verificar se está muito tempo em PROCESSING (crashed/stuck)
    const processingDuration = Date.now() - webhookEvent.processedAt.getTime();
    const MAX_PROCESSING_TIME = 5 * 60 * 1000; // 5 minutos
    
    if (processingDuration > MAX_PROCESSING_TIME && webhookEvent.status === 'PROCESSING') {
      this.logger.warn(`[Stripe] Event ${event.id} stuck in PROCESSING for ${processingDuration}ms. Resetting timestamp.`);
      // Reset the timestamp but keep processing
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { processedAt: new Date() },
      }).catch((err) => {
        this.logger.error(`[Stripe] Failed to reset stuck webhook timestamp: ${err.message}`);
      });
    }

    try {
      this.logger.log(`Processing stripe webhook: ${event.type}`);
      if (
        event.type === 'customer.created' ||
        event.type === 'customer.updated' ||
        event.type === 'customer.deleted' ||
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted' ||
        event.type === 'invoice.payment_succeeded' ||
        event.type === 'invoice.payment_failed' ||
        event.type === 'subscription_schedule.completed' ||
        event.type === 'subscription_schedule.released'
      ) {
        try {
          await this.discordService.sendToDiscord(
            'Webhook received',
            `Webhook received -> ${event.type}`,
          );
        } catch (discordError) {
          this.logger.warn(`[Stripe] Failed to send Discord notification: ${discordError.message}`);
          // Don't throw - webhook processing should continue even if Discord is down
        }

        switch (event.type) {
          case 'customer.created':
            await this.handleCustomerService.handleCustomerCreated(event);
            break;
          case 'customer.updated':
            await this.handleCustomerService.handleCustomerUpdated(event);
            break;
          case 'customer.deleted':
            await this.handleCustomerService.handleCustomerDeleted(event);
            break;
          case 'customer.subscription.created':
            await this.handleSubscriptionsService.handleCustomerSubscriptionCreated(
              event,
            );
            break;
          case 'customer.subscription.updated':
            await this.handleSubscriptionsService.handleCustomerSubscriptionUpdated(
              event,
            );
            break;
          case 'customer.subscription.deleted':
            await this.handleSubscriptionsService.handleCustomerSubscriptionDeleted(
              event,
            );
            break;
          case 'invoice.payment_succeeded':
            await this.handlePaymentsService.handleInvoicePaymentSucceeded(event);
            break;
          case 'invoice.payment_failed':
            await this.handlePaymentsService.handleInvoicePaymentFailed(event);
            break;
          default:
            this.logger.warn(`[Stripe] Event type not handled: ${event.type}`);
            break;
        }
      }

      // 3. Marcar como processado com sucesso
      await this.prisma.webhookEvent.update({
        where: {
          provider_eventId: {
            provider: 'stripe',
            eventId: event.id,
          },
        },
        data: { status: 'PROCESSED' },
      });
      this.logger.log(`[Stripe] Event ${event.id} processed successfully`);

    } catch (error) {
      this.logger.error(`[Stripe] Failed to process event ${event.id}: ${error.message}`);

      // Marcar como falha no banco - with proper error handling
      try {
        await this.prisma.webhookEvent.update({
          where: {
            provider_eventId: {
              provider: 'stripe',
              eventId: event.id,
            },
          },
          data: { status: 'FAILED' },
        });
      } catch (dbUpdateError) {
        this.logger.error(
          `[Stripe] Failed to update webhook status to FAILED: ${dbUpdateError.message}. Original error: ${error.message}`,
        );
        // Log both errors but don't swallow the original error
      }

      throw error;
    }
  }
}
