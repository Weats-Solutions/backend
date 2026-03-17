import { Injectable, Logger } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { Stripe } from 'stripe';
import { ulid } from 'ulid';

@Injectable()
export class HandlePaymentsService {
  private readonly logger = new Logger(HandlePaymentsService.name);

  constructor(private readonly prisma: CorePrismaService) { }

  async handleInvoicePaymentSucceeded(event: Stripe.Event) {
    this.logger.log(`✅ Handling invoice payment succeeded: ${event.id}`);
    return this.processInvoice(event);
  }

  async handleInvoicePaymentFailed(event: Stripe.Event) {
    this.logger.warn(`❌ Handling invoice payment failed: ${event.id}`);
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
