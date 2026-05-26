import { Inject, Injectable, Logger } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { Stripe } from 'stripe';
import { ACCEPTED_LANGUAGES, EmailTemplate, SendEmailDto } from '@weats/types';
import { EmailProducer } from '@weats/bull/producers/email.producer';
import { CacheService } from '@weats/cache';
import { StripeWebhooksHelpers } from './stripe-helpers.service';
import { DiscordService } from '@weats/integrations';

@Injectable()
export class HandlePaymentsService {
  private readonly logger = new Logger(HandlePaymentsService.name);

  constructor(
    @Inject('APP_URL') private readonly appUrl: string,
    private readonly prisma: CorePrismaService,
    private readonly emailProducer: EmailProducer,
    private readonly cacheService: CacheService,
    private readonly helpers: StripeWebhooksHelpers,
    private readonly discordService: DiscordService,
  ) { }

  // ─── Invoices ─────────────────────────────────────────────────────────────────

  async onInvoicePaid(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeCustomerId = this.helpers.resolveCustomerId(invoice.customer);
    const subscriptionId = this.helpers.resolveSubscriptionIdFromInvoice(invoice);

    if (!stripeCustomerId || !subscriptionId) {
      this.logger.warn(
        `invoice.paid ${invoice.id}: missing customerId or subscriptionId`,
      );
      return this.upsertInvoiceRecord(invoice, stripeCustomerId, subscriptionId);
    }

    try {
      const { establishment, subscription } = await this.helpers.fetchContext(
        stripeCustomerId,
        subscriptionId,
      );

      if (establishment?.owner && subscription) {
        const lang = this.helpers.resolveLang(establishment.primaryLanguage);
        const line = invoice.lines.data[0];

        // line.period.end é o fim do NOVO período de billing —
        // ou seja, quando o próximo débito vai ocorrer.
        // NÃO usar invoice.period_end aqui (é o período que acabou).
        const nextBillingDate = line
          ? this.helpers.formatDate(line.period.end, lang)
          : this.helpers.formatDate(invoice.period_end, lang);

        const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_PAYMENT_SUCCEEDED> = {
          to: establishment.owner.email,
          template: EmailTemplate.SUBSCRIPTION_PAYMENT_SUCCEEDED,
          lang,
          context: {
            firstName: establishment.owner.firstName ?? '',
            lastName: establishment.owner.lastName ?? '',
            establishmentName: establishment.name,
            planName: subscription.planCycle.plan.name,
            amountPaid: this.helpers.formatAmount(invoice.amount_paid, invoice.currency),
            periodStart: this.helpers.formatDate(invoice.period_start, lang),
            periodEnd: this.helpers.formatDate(invoice.period_end, lang),
            nextBillingDate,
            redirectUrl: `${this.appUrl}/settings/billing`,
          },
        };

        await this.emailProducer.send(payload);

        this.logger.log(`📧 Payment-succeeded email → ${establishment.owner.email}`);
      }
    } catch (err) {
      this.logger.error(`invoice.paid email error: ${(err as Error).message}`);
    }

    return this.upsertInvoiceRecord(invoice, stripeCustomerId, subscriptionId);
  }

  async onInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    // A Stripe já envia o email de falha de pagamento se tiveres
    // Dashboard → Billing → Customer emails → "Send emails when card payments fail" ativo.
    // Este handler grava o registo na DB para histórico/analytics.
    const invoice = event.data.object as Stripe.Invoice;
    const stripeCustomerId = this.helpers.resolveCustomerId(invoice.customer);
    const subscriptionId = this.helpers.resolveSubscriptionIdFromInvoice(invoice);

    this.logger.warn(
      `invoice.payment_failed ${invoice.id} | customer: ${stripeCustomerId} | attempt: ${invoice.attempt_count}`,
    );

    return this.upsertInvoiceRecord(invoice, stripeCustomerId, subscriptionId);
  }

  /**
   * Upsert de um registo de fatura.
   * Idempotente: seguro chamar várias vezes para a mesma fatura Stripe.
   */
  private async upsertInvoiceRecord(
    invoice: Stripe.Invoice,
    stripeCustomerId: string | undefined,
    subscriptionId: string | undefined,
  ): Promise<void> {
    if (!invoice.id || !invoice.status || !stripeCustomerId || !subscriptionId) {
      this.logger.warn(
        `upsertInvoiceRecord: dados incompletos para fatura ${invoice.id ?? '(no id)'}. ` +
        `customerId=${stripeCustomerId} subscriptionId=${subscriptionId}`,
      );
      return;
    }

    const [establishment, subscription] = await Promise.all([
      this.prisma.establishment.findUnique({ where: { stripeCustomerId } }),
      this.prisma.subscription.findUnique({ where: { stripeSubscriptionId: subscriptionId } }),
    ]);

    if (!establishment || !subscription) {
      this.logger.warn(
        `upsertInvoiceRecord: sem registo local para fatura ${invoice.id}. ` +
        `establishment=${!!establishment} subscription=${!!subscription}`,
      );
      return;
    }

    const invoiceData = {
      amountPaid: invoice.amount_paid,
      status: invoice.status as string,
      customerId: stripeCustomerId,
      establishmentId: establishment.id,
      subscriptionId: subscription.id,
    };

    const existing = await this.prisma.invoice.findFirst({
      where: { stripeInvoiceId: invoice.id },
    });

    if (existing) {
      await this.prisma.invoice.update({
        where: { id: existing.id },
        data: invoiceData,
      });
      this.logger.log(`Invoice ${invoice.id} updated → ${invoice.status}`);
    } else {
      await this.prisma.invoice.create({
        data: { stripeInvoiceId: invoice.id, ...invoiceData },
      });
      this.logger.log(`Invoice ${invoice.id} created → ${invoice.status}`);
    }
  }

  // ─── Disputes ─────────────────────────────────────────────────────────────────

  async onDisputeCreated(event: Stripe.Event): Promise<void> {
    const dispute = event.data.object as Stripe.Dispute;
    const stripeCustomerId = this.helpers.resolveCustomerId(
      (dispute as unknown as { customer?: string }).customer,
    );

    this.discordService.sendEmbed('stripe', {
      title: '⚠️ Dispute Created',
      message: `A new dispute has been opened and access has been revoked.`,
      color: 0xff9900,
      fields: [
        {
          name: 'Dispute ID',
          value: dispute.id,
          inline: true,
        },
        {
          name: 'Amount',
          value: this.helpers.formatAmount(dispute.amount, dispute.currency),
          inline: true,
        },
        {
          name: 'Reason',
          value: dispute.reason ?? 'N/A',
          inline: true,
        },
        {
          name: 'Customer ID',
          value: stripeCustomerId ?? 'N/A',
          inline: true,
        },
      ],
    }).catch((err: Error) => {
      this.logger.error(`[Stripe] Discord notification failed: ${err.message}`);
    });

    // Revogar acesso imediatamente para proteger contra fraude.
    // Acesso é reposto em onDisputeClosed se o dispute for ganho.
    if (stripeCustomerId) {
      const establishment = await this.prisma.establishment.findUnique({
        where: { stripeCustomerId },
        select: { id: true },
      });

      if (establishment) {
        await this.prisma.establishment.update({
          where: { id: establishment.id },
          data: { isActive: false },
        });

        this.logger.warn(`🚫 Access revoked for establishment ${establishment.id} (dispute)`);
      }
    }

    await this.prisma.dispute.upsert({
      where: { stripeDisputeId: dispute.id },
      create: {
        stripeDisputeId: dispute.id,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason ?? null,
        status: dispute.status,
        stripeCustomerId: stripeCustomerId ?? null,
      },
      update: { status: dispute.status },
    });
  }

  async onDisputeClosed(event: Stripe.Event): Promise<void> {
    const dispute = event.data.object as Stripe.Dispute;
    const stripeCustomerId = this.helpers.resolveCustomerId(
      (dispute as unknown as { customer?: string }).customer,
    );

    this.logger.log(`🏛️ Dispute closed: ${dispute.id} → ${dispute.status}`);

    await this.prisma.dispute.updateMany({
      where: { stripeDisputeId: dispute.id },
      data: { status: dispute.status },
    });

    // Só repor acesso se o dispute foi ganho
    if (dispute.status === 'won' && stripeCustomerId) {
      const establishment = await this.prisma.establishment.findUnique({
        where: { stripeCustomerId },
        select: { id: true },
      });

      if (establishment) {
        await this.prisma.establishment.update({
          where: { id: establishment.id },
          data: { isActive: true },
        });

        this.logger.log(`✅ Access restored for establishment ${establishment.id} (dispute won)`);
      }
    }
  }

  // ─── Refunds ──────────────────────────────────────────────────────────────────

  async onChargeRefunded(event: Stripe.Event): Promise<void> {
    const charge = event.data.object as Stripe.Charge;
    const stripeCustomerId = this.helpers.resolveCustomerId(charge.customer);

    this.logger.log(
      `💸 Charge refunded: ${charge.id} | ` +
      `refunded: ${this.helpers.formatAmount(charge.amount_refunded, charge.currency)} | ` +
      `full refund: ${charge.refunded}`,
    );

    const lastRefund = charge.refunds?.data?.[0];
    if (!lastRefund) return;

    await this.prisma.refund.upsert({
      where: { stripeRefundId: lastRefund.id },
      create: {
        stripeRefundId: lastRefund.id,
        stripeChargeId: charge.id,
        amount: lastRefund.amount,
        currency: lastRefund.currency,
        status: lastRefund.status ?? 'succeeded',
        stripeCustomerId: stripeCustomerId ?? null,
      },
      update: { status: lastRefund.status ?? 'succeeded' },
    });
  }
}