import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Stripe } from 'stripe';
import { CorePrismaService } from '@weats/database';
import { ACCEPTED_LANGUAGES, EmailTemplate, SendEmailDto } from '@weats/types';
import { EmailProducer } from '@weats/bull/producers/email.producer';
import { StripeService } from '@weats/integrations';
import { CacheService } from '@weats/cache';
import { StripeWebhooksHelpers } from './stripe-helpers.service';

@Injectable()
export class HandleSubscriptionsService {
  private readonly logger = new Logger(HandleSubscriptionsService.name);

  constructor(
    @Inject('APP_URL') private readonly appUrl: string,
    private readonly prisma: CorePrismaService,
    private readonly emailProducer: EmailProducer,
    private readonly stripeService: StripeService,
    private readonly cacheService: CacheService,
    private readonly helpers: StripeWebhooksHelpers,
  ) { }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private redirectUrl(lang: string, establishmentId: string): string {
    return `${this.appUrl}/${lang}/establishment/${establishmentId}`;
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  async handleCustomerSubscriptionCreated(event: Stripe.Event): Promise<void> {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const data = await this.helpers.fetchEstablishmentAndPlan(subscription);
      if (!data) return;

      const { customerId, establishment, planCycle } = data;
      const subData = this.helpers.buildSubscriptionData(subscription, planCycle.id);
      const lang = this.helpers.resolveLang(establishment.primaryLanguage);

      // Upsert defensivo: o checkout flow pode ter chegado primeiro
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

      await this.cacheService.clearEstablishmentCache(establishment.slug, establishment.id);
      if (subscription.status === 'trialing') {
        const trialStart = subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : subData.currentPeriodStart;
        const trialEnd = subData.trialEnd;

        const trialDays =
          trialStart && trialEnd
            ? Math.round((trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_TRIAL_STARTED> = {
          to: establishment.email,
          template: EmailTemplate.SUBSCRIPTION_TRIAL_STARTED,
          lang,
          context: {
            firstName: establishment.owner.firstName,
            lastName: establishment.owner.lastName,
            establishmentName: establishment.name,
            planName: planCycle.plan.name,
            trialDays,
            trialEndsAt: subData.trialEnd?.toLocaleDateString(lang) ?? '',
            redirectUrl: this.redirectUrl(lang, establishment.id),
          },
        };

        await this.emailProducer.send(payload);
        this.logger.log(`📧 Trial-started email → ${establishment.email}`);
      } else {
        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_CREATED> = {
          to: establishment.email,
          template: EmailTemplate.SUBSCRIPTION_CREATED,
          lang,
          context: {
            firstName: establishment.owner.firstName,
            lastName: establishment.owner.lastName,
            establishmentName: establishment.name,
            planName: planCycle.plan.name,
            nextBillingDate: subData.currentPeriodEnd?.toLocaleDateString(lang) ?? '',
            trialEndsAt: subData.trialEnd?.toLocaleDateString(lang),
            redirectUrl: this.redirectUrl(lang, establishment.id),
          },
        };

        await this.emailProducer.send(payload);
        this.logger.log(`📧 Subscription-created email → ${establishment.email}`);
      }
    } catch (error) {
      this.logger.error('handleCustomerSubscriptionCreated failed', error);
      throw new BadRequestException('Erro ao processar criação de assinatura');
    }
  }

  async handleCustomerSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const previous = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined;
      const data = await this.helpers.fetchEstablishmentAndPlan(subscription);
      if (!data) return;

      const { establishment, planCycle } = data;
      const subData = this.helpers.buildSubscriptionData(subscription, planCycle.id);
      const lang = this.helpers.resolveLang(establishment.primaryLanguage);

      await this.prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: subData,
      });

      await this.cacheService.clearEstablishmentCache(establishment.slug, establishment.id);
      // ── Transition detection ───────────────────────────────────────────────
      const justCanceled =
        subscription.cancel_at !== null && previous?.cancel_at === null;

      const justReactivated =
        subscription.cancel_at === null &&
        previous?.cancel_at !== undefined &&
        previous.cancel_at !== null;

      const justStartedTrial =
        (subscription.status === 'trialing' && previous?.status !== 'trialing') ||
        (subscription.trial_end !== null && previous?.trial_end === null);

      const justBecameActiveFromTrial =
        subscription.status === 'active' && previous?.status === 'trialing';

      // ── justCanceled ───────────────────────────────────────────────────────
      if (justCanceled) {
        this.logger.log(`Subscription ${subscription.id} scheduled for cancellation`);

        const portalUrl = await this.stripeService.getPortalSession({
          customerId: establishment.stripeCustomerId,
          returnUrl: this.redirectUrl(lang, establishment.id),
        });

        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_CANCELLED> = {
          to: establishment.email,
          template: EmailTemplate.SUBSCRIPTION_CANCELLED,
          lang,
          context: {
            firstName: establishment.owner.firstName,
            lastName: establishment.owner.lastName,
            establishmentName: establishment.name,
            planName: planCycle.plan.name,
            accessUntil: subData.currentPeriodEnd?.toLocaleDateString(lang) ?? '',
            redirectUrl: portalUrl,
          },
        };

        await this.emailProducer.send(payload);
        this.logger.log(`📧 Subscription-cancelled email → ${establishment.email}`);
      }

      // ── justReactivated ────────────────────────────────────────────────────
      if (justReactivated) {
        this.logger.log(`Subscription ${subscription.id} reactivated`);

        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_REACTIVATED> = {
          to: establishment.email,
          template: EmailTemplate.SUBSCRIPTION_REACTIVATED,
          lang,
          context: {
            firstName: establishment.owner.firstName,
            lastName: establishment.owner.lastName,
            establishmentName: establishment.name,
            planName: planCycle.plan.name,
            nextBillingDate: subData.currentPeriodEnd?.toLocaleDateString(lang) ?? '',
            redirectUrl: this.redirectUrl(lang, establishment.id),
          },
        };

        await this.emailProducer.send(payload);
        this.logger.log(`📧 Subscription-reactivated email → ${establishment.email}`);
      }

      // ── justStartedTrial ───────────────────────────────────────────────────
      if (justStartedTrial) {
        this.logger.log(`Subscription ${subscription.id} entered trial`);

        const trialStart = subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : subData.currentPeriodStart;
        const trialEnd = subData.trialEnd;

        const trialDays =
          trialStart && trialEnd
            ? Math.round((trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_TRIAL_STARTED> = {
          to: establishment.email,
          template: EmailTemplate.SUBSCRIPTION_TRIAL_STARTED,
          lang,
          context: {
            firstName: establishment.owner.firstName,
            lastName: establishment.owner.lastName,
            establishmentName: establishment.name,
            planName: planCycle.plan.name,
            trialDays,
            trialEndsAt: subData.trialEnd?.toLocaleDateString(lang) ?? '',
            redirectUrl: this.redirectUrl(lang, establishment.id),
          },
        };

        await this.emailProducer.send(payload);
        this.logger.log(`📧 Trial-started email → ${establishment.email}`);
      }

      // ── justBecameActiveFromTrial ──────────────────────────────────────────
      if (justBecameActiveFromTrial) {
        this.logger.log(`Subscription ${subscription.id} converted trial → active`);

        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_CREATED> = {
          to: establishment.email,
          template: EmailTemplate.SUBSCRIPTION_CREATED,
          lang,
          context: {
            firstName: establishment.owner.firstName,
            lastName: establishment.owner.lastName,
            establishmentName: establishment.name,
            planName: planCycle.plan.name,
            nextBillingDate: subData.currentPeriodEnd?.toLocaleDateString(lang) ?? '',
            redirectUrl: this.redirectUrl(lang, establishment.id),
          },
        };

        await this.emailProducer.send(payload);
        this.logger.log(`📧 Trial-converted email → ${establishment.email}`);
      }
    } catch (error) {
      this.logger.error('handleCustomerSubscriptionUpdated failed', error);
      throw new BadRequestException('Erro ao processar atualização de assinatura');
    }
  }

  async handleCustomerSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const data = await this.helpers.fetchEstablishmentAndPlan(subscription);
      if (!data) return;

      const { establishment, planCycle } = data;
      const lang = this.helpers.resolveLang(establishment.primaryLanguage);

      // Para deleção só atualizamos status e campos de cancelamento —
      // não tocar no planCycleId para evitar FK violation
      const updateData = {
        status: this.helpers.mapStripeStatus(subscription.status),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: this.helpers.toDate(subscription.cancel_at),
        canceledAt: this.helpers.toDate(subscription.canceled_at),
      };

      await this.prisma.subscription.update({
        where: { establishmentId: establishment.id },
        data: updateData,
      });

      await this.cacheService.clearEstablishmentCache(establishment.slug, establishment.id);
      const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_CANCELLED> = {
        to: establishment.email,
        template: EmailTemplate.SUBSCRIPTION_CANCELLED,
        lang,
        context: {
          firstName: establishment.owner.firstName,
          lastName: establishment.owner.lastName,
          establishmentName: establishment.name,
          planName: planCycle.plan.name,
          accessUntil: updateData.cancelAt?.toLocaleDateString(lang) ?? '',
          redirectUrl: this.redirectUrl(lang, establishment.id),
        },
      };

      await this.emailProducer.send(payload);
      this.logger.log(`📧 Subscription-deleted email → ${establishment.email}`);
    } catch (error) {
      this.logger.error('handleCustomerSubscriptionDeleted failed', error);
      throw new BadRequestException('Erro ao processar cancelamento de assinatura');
    }
  }

  async handleCustomerSubscriptionPaused(event: Stripe.Event): Promise<void> {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const data = await this.helpers.fetchEstablishmentAndPlan(subscription);
      if (!data) return;

      const { establishment, planCycle } = data;
      const lang = this.helpers.resolveLang(establishment.primaryLanguage);

      await this.prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: this.helpers.mapStripeStatus(subscription.status) },
      });

      await this.cacheService.clearEstablishmentCache(establishment.slug, establishment.id);
      const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_PAUSED> = {
        to: establishment.email,
        template: EmailTemplate.SUBSCRIPTION_PAUSED,
        lang,
        context: {
          firstName: establishment.owner.firstName,
          lastName: establishment.owner.lastName,
          establishmentName: establishment.name,
          planName: planCycle.plan.name,
          redirectUrl: this.redirectUrl(lang, establishment.id),
        },
      };

      await this.emailProducer.send(payload);
      this.logger.log(`📧 Subscription-paused email → ${establishment.email}`);
    } catch (error) {
      this.logger.error('handleCustomerSubscriptionPaused failed', error);
      throw new BadRequestException('Erro ao processar pausa de assinatura');
    }
  }

  async handleCustomerSubscriptionResumed(event: Stripe.Event): Promise<void> {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const data = await this.helpers.fetchEstablishmentAndPlan(subscription);
      if (!data) return;

      const { establishment, planCycle } = data;
      const subData = this.helpers.buildSubscriptionData(subscription, planCycle.id);
      const lang = this.helpers.resolveLang(establishment.primaryLanguage);

      await this.prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: subData,
      });

      await this.cacheService.clearEstablishmentCache(establishment.slug, establishment.id);
      const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_REACTIVATED> = {
        to: establishment.email,
        template: EmailTemplate.SUBSCRIPTION_REACTIVATED,
        lang,
        context: {
          firstName: establishment.owner.firstName,
          lastName: establishment.owner.lastName,
          establishmentName: establishment.name,
          planName: planCycle.plan.name,
          nextBillingDate: subData.currentPeriodEnd?.toLocaleDateString(lang) ?? '',
          redirectUrl: this.redirectUrl(lang, establishment.id),
        },
      };

      await this.emailProducer.send(payload);
      this.logger.log(`📧 Subscription-resumed email → ${establishment.email}`);
    } catch (error) {
      this.logger.error('handleCustomerSubscriptionResumed failed', error);
      throw new BadRequestException('Erro ao processar retoma de assinatura');
    }
  }

  async handleCustomerSubscriptionTrialWillEnd(event: Stripe.Event): Promise<void> {
    // Nota: a Stripe já envia o email de "trial a terminar" se tiveres
    // Dashboard → Billing → Customer emails → "Send a reminder email 7 days before a trial ends" ativo.
    // Este handler existe para sincronização DB / lógica interna adicional.
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const data = await this.helpers.fetchEstablishmentAndPlan(subscription);
      if (!data) return;

      const { establishment, planCycle } = data;
      const subData = this.helpers.buildSubscriptionData(subscription, planCycle.id);
      const lang = this.helpers.resolveLang(establishment.primaryLanguage);

      const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_TRIAL_ENDING> = {
        to: establishment.email,
        template: EmailTemplate.SUBSCRIPTION_TRIAL_ENDING,
        lang,
        context: {
          firstName: establishment.owner.firstName,
          lastName: establishment.owner.lastName,
          establishmentName: establishment.name,
          planName: planCycle.plan.name,
          trialEndsAt: subData.trialEnd?.toLocaleDateString(lang) ?? '',
          redirectUrl: this.redirectUrl(lang, establishment.id),
        },
      };

      await this.emailProducer.send(payload);
      this.logger.log(`📧 Trial-ending email → ${establishment.email}`);
    } catch (error) {
      this.logger.error('handleCustomerSubscriptionTrialWillEnd failed', error);
      throw new BadRequestException('Erro ao processar fim de trial');
    }
  }
}