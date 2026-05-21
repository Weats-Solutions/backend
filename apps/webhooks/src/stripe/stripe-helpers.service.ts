import { CorePrismaService, SubscriptionStatus } from '@weats/database';
import { ACCEPTED_LANGUAGES } from '@weats/types';
import Stripe from 'stripe';
import { Inject, Logger, Injectable } from '@nestjs/common';

@Injectable()
export class StripeWebhooksHelpers {
  private readonly logger = new Logger(StripeWebhooksHelpers.name);

  constructor(private readonly prisma: CorePrismaService) { }

  /**
   * Extracts stripeCustomerId from an invoice, subscription, dispute, or charge.
   * The `customer` field can be a string ID or an expanded Customer object.
   */
  resolveCustomerId(
    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
  ): string | undefined {
    if (!customer) return undefined;
    if (typeof customer === 'string') return customer;
    return customer.id;
  }

  /**
   * Extracts the Stripe subscription ID from an Invoice object.
   *
   * Dahlia (2026-04-22): invoice.subscription is removed.
   * Use invoice.parent.subscription_details.subscription
   * when invoice.parent.type === 'subscription_details'.
   */
  resolveSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
    const parent = invoice.parent;
    if (parent?.type === 'subscription_details') {
      const sub = parent.subscription_details?.subscription;
      if (typeof sub === 'string') return sub;
      if (sub && typeof sub === 'object') return sub.id;
    }
    return undefined;
  }

  /**
   * Returns the ACCEPTED_LANGUAGES code for an establishment's primaryLanguage,
   * falling back to 'pt'.
   */
  resolveLang(primaryLanguage?: string | null): ACCEPTED_LANGUAGES {
    const lang = primaryLanguage?.toLowerCase() ?? 'pt';
    return (['pt', 'en', 'es'].includes(lang) ? lang : 'pt') as ACCEPTED_LANGUAGES;
  }

  formatAmount(amountInCents: number, currency?: string | null): string {
    return `${(amountInCents / 100).toFixed(2)} ${(currency ?? 'EUR').toUpperCase()}`;
  }

  formatDate(unixSeconds: number, lang: string): string {
    return new Date(unixSeconds * 1000).toLocaleDateString(lang);
  }

  toDate(timestamp?: number | null): Date | null | undefined {
    if (timestamp === null) return null; // null explícito limpa o campo na DB
    return timestamp ? new Date(timestamp * 1000) : undefined;
  }

  /**
   * Fetches establishment (with owner) and subscription in parallel.
   * Always includes owner — usado para envio de emails.
   */
  async fetchContext(stripeCustomerId: string, stripeSubscriptionId: string) {
    const [establishment, subscription] = await Promise.all([
      this.prisma.establishment.findUnique({
        where: { stripeCustomerId },
        include: { owner: true },
      }),
      this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId },
        include: { planCycle: { include: { plan: true } } },
      }),
    ]);
    return { establishment, subscription };
  }

  /**
   * Fetches establishment (with owner) and planCycle from a subscription object.
   * Usado em handlers de subscription onde ainda não há stripeSubscriptionId na DB.
   */
  async fetchEstablishmentAndPlan(subscription: Stripe.Subscription) {
    const customerId = this.resolveCustomerId(subscription.customer);
    if (!customerId) return null;

    const establishment = await this.prisma.establishment.findUnique({
      where: { stripeCustomerId: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        stripeCustomerId: true,
        primaryLanguage: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    if (!establishment) return null;

    const planCycle = await this.prisma.planCycle.findUnique({
      where: { priceId: subscription.items.data[0].price.id },
      include: { plan: { select: { name: true } } },
    });
    if (!planCycle) return null;

    return { customerId, establishment, planCycle };
  }

  mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'past_due':
      case 'unpaid':
      case 'paused':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE_EXPIRED;
      default:
        return SubscriptionStatus.CANCELED;
    }
  }

  /**
   * Builds the subscription data object from a Stripe subscription.
   * Uses items[0].current_period_* since that's where Dahlia exposes it.
   */
  buildSubscriptionData(subscription: Stripe.Subscription, planCycleId: string) {
    const item = subscription.items.data[0];
    return {
      planCycleId,
      status: this.mapStripeStatus(subscription.status),
      currentPeriodStart: this.toDate(item.current_period_start),
      currentPeriodEnd: this.toDate(item.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: this.toDate(subscription.cancel_at),
      canceledAt: this.toDate(subscription.canceled_at),
      trialEnd: this.toDate(subscription.trial_end),
    };
  }

  /**
   * Syncs a subscription's status + period fields to the DB.
   * Call this from every subscription event handler.
   */
  async syncSubscriptionStatus(
    stripeSubscriptionId: string,
    subscription: Stripe.Subscription,
    planCycleId: string,
  ): Promise<void> {
    const data = this.buildSubscriptionData(subscription, planCycleId);

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId },
      data,
    });

    this.logger.log(`🔄 Subscription ${stripeSubscriptionId} synced → ${subscription.status}`);
  }
}