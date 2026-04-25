import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { SubscriptionStatus } from '@weats/database';
import { Stripe } from 'stripe';
import { Logger } from '@nestjs/common';
import { ClerkService } from '@weats/integrations';
import { StripeService } from '@weats/integrations';
import { CorePrismaService } from '@weats/database';
import { SendEmailDto, EmailTemplate, ACCEPTED_LANGUAGES } from '@weats/types';
import { EmailProducer } from '@weats/bull/producers/email.producer';

@Injectable()
export class HandleSubscriptionsService {
  private readonly logger = new Logger(HandleSubscriptionsService.name);

  constructor(
    @Inject('APP_URL') private readonly appUrl: string,
    private readonly stripeService: StripeService,
    private readonly prisma: CorePrismaService,
    private readonly emailProducer: EmailProducer,
    private readonly clerkService: ClerkService,
  ) { }

  private async getEstablishmentAndPlan(subscription: Stripe.Subscription) {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;
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
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!planCycle) return null;

    return { customerId, establishment, planCycle };
  }

  private toDate(timestamp?: number | null) {
    if (timestamp === null) return null; // Retorna null explicitamente para limpar a DB
    return timestamp ? new Date(timestamp * 1000) : undefined;
  }

  private mapStatus(status: string): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE_EXPIRED;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }

  private buildSubscriptionData(
    subscription: Stripe.Subscription,
    planCycleId: string,
  ) {
    return {
      planCycleId,
      status: this.mapStatus(subscription.status),
      currentPeriodStart: this.toDate(
        subscription.items.data[0].current_period_start,
      ),
      currentPeriodEnd: this.toDate(
        subscription.items.data[0].current_period_end,
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: this.toDate(subscription.cancel_at),
      canceledAt: this.toDate(subscription.canceled_at),
      trialEnd: this.toDate(subscription.trial_end),
    };
  }

  private async updateClerkMetadata(
    establishmentId: string,
    stripeStatus: string,
  ) {
    try {
      const establishment = await this.prisma.establishment.findUnique({
        where: { id: establishmentId },
        include: { owner: true },
      });

      if (!establishment || !establishment.owner) return;

      const clerkUser = await this.clerkService.getUser(
        establishment.owner.clerkUserId,
      );
      const currentMetadata = clerkUser.publicMetadata;
      const establishments = currentMetadata.establishments || {};

      let status = 'INACTIVE';
      if (stripeStatus === 'active') status = 'ACTIVE';
      if (stripeStatus === 'trialing') status = 'TRIALING';

      this.logger.log(
        `Updating Clerk metadata for establishment ${establishmentId}: Stripe Status=${stripeStatus} -> App Status=${status}`,
      );

      establishments[establishment.id] = {
        status: status,
        role: 'OWNER',
      };

      await this.clerkService.updateUserMetadata(
        establishment.owner.clerkUserId,
        {
          establishments,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Clerk metadata for establishment ${establishmentId}:`,
        error,
      );
    }
  }

  async handleCustomerSubscriptionCreated(event: Stripe.Event) {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const data = await this.getEstablishmentAndPlan(subscription);
      if (!data) return;

      const { customerId, establishment, planCycle } = data;
      const subData = this.buildSubscriptionData(subscription, planCycle.id);

      // Use establishmentId as unique key since one establishment = one subscription
      await this.prisma.subscription.upsert({
        where: { establishmentId: establishment.id },
        update: {
          ...subData,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
        },
        create: {
          ...subData,
          establishmentId: establishment.id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
        },
      });

      const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_CREATED> = {
        to: establishment.email,
        template: EmailTemplate.SUBSCRIPTION_CREATED,
        lang: establishment.primaryLanguage.toLowerCase() as ACCEPTED_LANGUAGES,
        context: {
          firstName: establishment.owner.firstName,
          lastName: establishment.owner.lastName,
          establishmentName: establishment.name,
          planName: planCycle.plan.name,
          nextBillingDate: subData.currentPeriodEnd?.toLocaleDateString(
            establishment.primaryLanguage.toLowerCase(),
          ),
          trialEndsAt: subData.trialEnd?.toLocaleDateString(
            establishment.primaryLanguage.toLowerCase(),
          ),
          redirectUrl: `${this.appUrl}/${establishment.primaryLanguage.toLowerCase()}/establishment/${establishment.id}`,
        },
      };

      await this.emailProducer.send(payload);

      await this.updateClerkMetadata(establishment.id, subscription.status);
    } catch (error) {
      this.logger.error('Erro em handleCustomerSubscriptionCreated', error);
      throw new BadRequestException('Erro ao processar assinatura');
    }
  }

  async handleCustomerSubscriptionUpdated(event: Stripe.Event) {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const data = await this.getEstablishmentAndPlan(subscription);
      if (!data) return;

      const { establishment, planCycle } = data;

      const subData = this.buildSubscriptionData(subscription, planCycle.id);

      await this.prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: subData,
      });

      const previousAttributes = event.data
        .previous_attributes as Partial<Stripe.Subscription>;

      const justCanceled =
        subscription.cancel_at !== null &&
        previousAttributes?.cancel_at === null;
      const justReactivated =
        subscription.cancel_at === null &&
        previousAttributes?.cancel_at !== undefined &&
        previousAttributes?.cancel_at !== null;
      const justStartedTrial =
        (subscription.status === 'trialing' &&
          previousAttributes?.status !== 'trialing') ||
        (subscription.trial_end !== null &&
          previousAttributes?.trial_end === null);

      if (justCanceled) {
        this.logger.log(
          `Subscription ${subscription.id} scheduled for cancellation.`,
        );

        const portalUrl = await this.stripeService.getPortalSession({
          customerId: establishment.stripeCustomerId,
          returnUrl: `${this.appUrl}/${establishment.primaryLanguage.toLowerCase()}/establishment/${establishment.id}/subscription`,
        });

        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_CANCELED> = {
          to: establishment.email,
          template: EmailTemplate.SUBSCRIPTION_CANCELED,
          lang: establishment.primaryLanguage.toLowerCase() as ACCEPTED_LANGUAGES,
          context: {
            firstName: establishment.owner.firstName,
            lastName: establishment.owner.lastName,
            establishmentName: establishment.name,
            accessUntil: subData.currentPeriodEnd?.toLocaleDateString(
              establishment.primaryLanguage.toLowerCase(),
            ),
            redirectUrl: portalUrl,
          },
        };

        await this.emailProducer.send(payload);
      }

      if (justReactivated) {
        this.logger.log(
          `Subscription ${subscription.id} has been reactivated (uncanceled).`,
        );

        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_REACTIVATED> = {
          to: establishment.email,
          template: EmailTemplate.SUBSCRIPTION_REACTIVATED,
          lang: establishment.primaryLanguage.toLowerCase() as ACCEPTED_LANGUAGES,
          context: {
            firstName: establishment.owner.firstName,
            lastName: establishment.owner.lastName,
            establishmentName: establishment.name,
            accessUntil: subData.currentPeriodEnd?.toLocaleDateString(
              establishment.primaryLanguage.toLowerCase(),
            ),
            nextBillingDate: subData.currentPeriodEnd?.toLocaleDateString(
              establishment.primaryLanguage.toLowerCase(),
            ),
            redirectUrl: `${this.appUrl}/${establishment.primaryLanguage.toLowerCase()}/establishment/${establishment.id}`,
          },
        };

        await this.emailProducer.send(payload);
      }

      if (justStartedTrial) {
        this.logger.log(
          `Subscription ${subscription.id} entered trial period.`,
        );

        const trialStart = subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : subData.currentPeriodStart;
        const trialEnd = subData.trialEnd;

        const trialDays =
          trialStart && trialEnd
            ? Math.round(
              (trialEnd.getTime() - trialStart.getTime()) /
              (1000 * 60 * 60 * 24),
            )
            : 0;

        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_TRIAL_STARTED> = {
          to: establishment.email,
          template: EmailTemplate.SUBSCRIPTION_TRIAL_STARTED,
          lang: establishment.primaryLanguage.toLowerCase() as ACCEPTED_LANGUAGES,
          context: {
            firstName: establishment.owner.firstName,
            lastName: establishment.owner.lastName,
            establishmentName: establishment.name,
            planName: data.planCycle.plan.name,
            trialDays: trialDays,
            trialEndsAt: subData.trialEnd?.toLocaleDateString(
              establishment.primaryLanguage.toLowerCase(),
            ),
            redirectUrl: `${this.appUrl}/${establishment.primaryLanguage.toLowerCase()}/establishment/${establishment.id}/subscription`,
          },
        };

        await this.emailProducer.send(payload);
      }

      await this.updateClerkMetadata(establishment.id, subscription.status);
    } catch (error) {
      this.logger.error('Erro em handleCustomerSubscriptionUpdated', error);
      throw new BadRequestException('Erro ao processar assinatura');
    }
  }

  async handleCustomerSubscriptionDeleted(event: Stripe.Event) {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const data = await this.getEstablishmentAndPlan(subscription);
      if (!data) return;

      const { establishment } = data;

      // For deletion, we only update status and cancellation fields
      // Do NOT update planCycleId to avoid FK constraint violation
      const updateData = {
        status: this.mapStatus(subscription.status),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: this.toDate(subscription.cancel_at || undefined),
        canceledAt: this.toDate(subscription.canceled_at || undefined),
      };

      // Use establishmentId since it's the stable unique key
      await this.prisma.subscription.update({
        where: {
          establishmentId: establishment.id,
        },
        data: updateData,
      });

      await this.updateClerkMetadata(establishment.id, subscription.status);
    } catch (error) {
      this.logger.error('Erro em handleCustomerSubscriptionDeleted', error);
      throw new BadRequestException('Erro ao processar assinatura');
    }
  }
}
