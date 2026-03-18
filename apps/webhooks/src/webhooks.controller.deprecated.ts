/**
 * ⚠️ DEPRECATED - This file is no longer needed
 * 
 * This controller was used to relay webhook events from Gateway to Bull Queue.
 * It was redundant because it was just forwarding events to the same queue
 * that the Gateway can now add to directly.
 * 
 * MIGRATION:
 * - Gateway now adds 'stripe-event' and 'clerk-event' jobs directly to the Bull queue
 * - This eliminates one unnecessary Redis hop
 * - Processor and Services remain in this microservice unchanged
 * 
 * Historical code (kept for reference):
 * 
 * @Controller()
 * export class WebhooksController {
 *   constructor(
 *     @InjectQueue('webhooks-queue') private readonly webhooksQueue: Queue
 *   ) { }
 *
 *   @EventPattern(WEBHOOK_PATTERNS.STRIPE_WEBHOOK)
 *   async handleStripeWebhook(event: Stripe.Event) {
 *     await this.webhooksQueue.add('stripe-event', event, {...});
 *   }
 *
 *   @EventPattern(WEBHOOK_PATTERNS.CLERK_WEBHOOK)
 *   async handleClerkWebhook(event: any) {
 *     await this.webhooksQueue.add('clerk-event', event, {...});
 *   }
 * }
 */
