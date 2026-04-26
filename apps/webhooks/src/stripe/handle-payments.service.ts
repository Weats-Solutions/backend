import { Inject, Injectable, Logger } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { Stripe } from 'stripe';
import { ulid } from 'ulid';
import { ACCEPTED_LANGUAGES, EmailTemplate, SendEmailDto } from '@weats/types';
import { EmailProducer } from '@weats/bull/producers/email.producer';

@Injectable()
export class HandlePaymentsService {
  private readonly logger = new Logger(HandlePaymentsService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    @Inject('APP_URL') private readonly appUrl: string,
    private readonly emailProducer: EmailProducer,
  ) { }

  async handleInvoicePaymentSucceeded(event: Stripe.Event) {
    this.logger.log(`✅ Handling invoice payment succeeded: ${event.id}`);
    return this.processInvoice(event);
  }

  async handleInvoicePaymentFailed(event: Stripe.Event) {
    this.logger.warn(`❌ Handling invoice payment failed: ${event.id}`);

    try {
      const invoice = event.data.object as Stripe.Invoice;

      let stripeCustomerId: string | undefined;

      if (typeof invoice.customer === 'string') {
        stripeCustomerId = invoice.customer;
      } else if (
        invoice.customer &&
        typeof invoice.customer === 'object' &&
        'id' in invoice.customer
      ) {
        stripeCustomerId = (invoice.customer as any).id;
      }

      if (stripeCustomerId) {
        const subscriptionId = (invoice as any).subscription as string || 
          invoice.lines.data[0]?.parent?.subscription_item_details?.subscription;

        if (subscriptionId) {
          const establishment = await this.prisma.establishment.findUnique({ 
            where: { stripeCustomerId },
            include: { owner: true }
          });

          const subscription = await this.prisma.subscription.findUnique({ 
            where: { stripeSubscriptionId: subscriptionId },
            include: { planCycle: { include: { plan: true } } }
          });

          if (establishment && establishment.owner && subscription) {
            let lang = establishment.primaryLanguage?.toLowerCase() || 'pt';
            if (!['pt', 'en', 'es'].includes(lang)) {
                lang = 'pt';
            }

            const amountToPay = (invoice.amount_due / 100).toFixed(2) + ' ' + (invoice.currency ? invoice.currency.toUpperCase() : 'EUR');
            const periodStart = new Date(invoice.period_start * 1000).toLocaleDateString(lang);
            const periodEnd = new Date(invoice.period_end * 1000).toLocaleDateString(lang);

            const payload: SendEmailDto<EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED> = {
                to: establishment.owner.email,
                template: EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED,
                lang: lang as ACCEPTED_LANGUAGES,
                context: {
                    firstName: establishment.owner.firstName || '',
                    lastName: establishment.owner.lastName || '',
                    establishmentName: establishment.name,
                    planName: subscription.planCycle?.plan?.name || 'Plano',
                    amountPaid: amountToPay,
                    periodStart: periodStart,
                    periodEnd: periodEnd,
                    redirectUrl: `${this.appUrl}/settings/billing`,
                },
            };

            await this.emailProducer.send(payload);
            this.logger.log(`📧 Email de falha de pagamento enviado para ${establishment.owner.email}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar email de falha de pagamento: ${(error as Error).message}`);
    }

    return this.processInvoice(event);
  }

  private async processInvoice(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;

    let stripeCustomerId: string | undefined;

    if (typeof invoice.customer === 'string') {
      stripeCustomerId = invoice.customer;
    } else if (
      invoice.customer &&
      typeof invoice.customer === 'object' &&
      'id' in invoice.customer
    ) {
      stripeCustomerId = (invoice.customer as any).id;
    }

    if (!stripeCustomerId) {
      this.logger.warn(`stripeCustomerId não encontrado para fatura ${invoice.id}`);
      return;
    }

    const subscriptionId = (invoice as any).subscription as string || 
      invoice.lines.data[0]?.parent?.subscription_item_details?.subscription;

    if (!subscriptionId) {
      this.logger.warn(`subscriptionId não encontrado para fatura ${invoice.id}`);
      return;
    }

    const establishment = await this.prisma.establishment.findUnique({ 
      where: { stripeCustomerId } 
    });

    const subscription = await this.prisma.subscription.findUnique({ 
      where: { stripeSubscriptionId: subscriptionId } 
    });

    if (!establishment || !subscription || !invoice.id || !invoice.status) {
      this.logger.warn(`Dados incompletos para processar fatura ${invoice.id}. Estabelecimento: ${!!establishment}, Assinatura: ${!!subscription}`);
      return;
    }

    const invoiceId = invoice.id;
    const invoiceStatus = invoice.status as string;

    const existingInvoice = await this.prisma.invoice.findFirst({ 
      where: { stripeInvoiceId: invoiceId } 
    });

    if (existingInvoice) {
      await this.prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: {
          amountPaid: invoice.amount_paid,
          status: invoiceStatus,
          customerId: stripeCustomerId,
          establishmentId: establishment.id,
          subscriptionId: subscriptionId,
        },
      });
      this.logger.log(`Invoice ${invoiceId} updated with status ${invoiceStatus}`);
    } else {
      await this.prisma.invoice.create({
        data: {
          id: ulid(),
          establishmentId: establishment.id,
          stripeInvoiceId: invoiceId,
          subscriptionId: subscriptionId,
          amountPaid: invoice.amount_paid,
          status: invoiceStatus,
          customerId: stripeCustomerId,
        },
      });
      this.logger.log(`Invoice ${invoiceId} created with status ${invoiceStatus}`);
    }
  }
}
