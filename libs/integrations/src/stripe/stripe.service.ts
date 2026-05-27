import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import Stripe from 'stripe';

interface GetPortalSessionParams {
  customerId: string;
  returnUrl: string;
}

interface CreateCheckoutSessionParams {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  trial?: boolean;
}

interface CreateCustomer {
  name: string;
  business_name?: string;
  email: string;
  phone: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  tax_id_data?: Array<{
    type: string;
    value: string;
  }>;
  metadata?: {
    establishmentId?: string;
    ownerId?: string;
  };
}
interface UpdateCustomer {
  name?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  business_name?: string;
  metadata?: {
    establishmentName?: string;
    establishmentId?: string;
    ownerId?: string;
  };
}

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @Inject('STRIPE_API_KEY') private readonly apiKey: string,
    @Inject('STRIPE_API_VERSION') private readonly apiVersion: string,
    @Inject('STRIPE_WEBHOOK_SECRET') private readonly webhookSecret: string,
  ) {
    this.stripe = new Stripe(this.apiKey, {
      apiVersion: this.apiVersion as Stripe.LatestApiVersion,
    });
  }

  verifySignature(
    rawBody: Buffer,
    signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );
    } catch (err) {
      this.logger.log(`⚠️ Webhook signature verification failed.`, err.message);
      throw new UnauthorizedException('Invalid signature');
    }

    return event;
  }

  async createCustomer(data: CreateCustomer): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      name: data.name,
      email: data.email,
      address: data.address,
      phone: data.phone,
      tax_id_data: data.tax_id_data as Stripe.CustomerCreateParams.TaxIdDatum[],
      business_name: data.name,
      metadata: {
        ...data.metadata,
      },
      preferred_locales: ['pt-PT', 'en-US'],
    });
    return customer;
  }

  async createB2BCustomer(data: CreateCustomer): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email: data.email,
      phone: data.phone,
      address: data.address,
      business_name: data.business_name,
      metadata: {
        ...data.metadata,
      },
      preferred_locales: ['pt-PT', 'en-US'],
    });

    if (data.tax_id_data) {
      await this.createCustomerTaxId(
        customer.id,
        data.tax_id_data[0].value,
      );
    }

    return customer;
  }

  async createCustomerTaxId(
    customerId: string,
    taxId: string,
  ): Promise<Stripe.TaxId> {
    return await this.stripe.customers.createTaxId(
      customerId,
      {
        type: "eu_vat",
        value: taxId,
      }
    );
  }

  async listCustomerTaxIds(
    customerId: string,
  ): Promise<Stripe.TaxId[]> {
    const response = await this.stripe.customers.listTaxIds(customerId);
    return response.data;
  }

  async deleteCustomerTaxId(
    customerId: string,
    taxId: string,
  ): Promise<Stripe.DeletedTaxId> {
    return await this.stripe.customers.deleteTaxId(customerId, taxId);
  }

  async updateCustomer(
    customerId: string,
    data: UpdateCustomer,
  ): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.update(customerId, {
        name: data.name,
        email: data.email,
        address: data.address,
        phone: data.phone,
        business_name: data.business_name,
        metadata: {
          ...data.metadata,
          ...(data.business_name ? { business_name: data.business_name } : {}),
        },
        preferred_locales: ['pt-PT', 'en-US'],
      });
    } catch (error) {
      this.logger.error('Stripe Update Error:', error.message);
      throw error;
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await this.stripe.customers.del(customerId);
  }

  async getPortalSession(params: GetPortalSessionParams): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
    return session.url;
  }

  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<string> {
    const baseSessionData: Stripe.Checkout.SessionCreateParams = {
      billing_address_collection: 'required',
      mode: 'subscription',
      payment_method_types: ['card', 'revolut_pay'],
      allow_promotion_codes: true,
      customer: params.customerId,
      phone_number_collection: {
        enabled: true,
      },

      automatic_tax: {
        enabled: false,
      },

      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      tax_id_collection: {
        enabled: true,
        required: 'if_supported',
      },
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        ...params.metadata,
      },
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
    };

    if (params.trial) {
      baseSessionData.subscription_data = {
        trial_period_days: 30,
      };
    }

    const session = await this.stripe.checkout.sessions.create(baseSessionData);

    if (!session.url) {
      throw new InternalServerErrorException(
        'Failed to create checkout session URL',
      );
    }

    return session.url;
  }

  async hasActiveSubscription(customerId: string): Promise<boolean> {
    try {
      // Fazemos duas chamadas em paralelo para verificar se existe alguma assinatura
      // 'active' OU 'trialing', limitando a 1 resultado para otimizar.
      const [activeSubs, trialingSubs] = await Promise.all([
        this.stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        }),
        this.stripe.subscriptions.list({
          customer: customerId,
          status: 'trialing',
          limit: 1,
        }),
      ]);

      return activeSubs.data.length > 0 || trialingSubs.data.length > 0;
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  async getSubscriptionStatus(customerId: string): Promise<string> {
    try {
      const [activeSubs, trialingSubs] = await Promise.all([
        this.stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        }),
        this.stripe.subscriptions.list({
          customer: customerId,
          status: 'trialing',
          limit: 1,
        }),
      ]);

      if (activeSubs.data.length > 0) return 'ACTIVE';
      if (trialingSubs.data.length > 0) return 'TRIALING';
      return 'INACTIVE';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return 'INACTIVE';
    }
  }

  async getSubscriptionById(
    subscriptionId: string,
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const canceledSubscription =
        await this.stripe.subscriptions.cancel(subscriptionId);
      return canceledSubscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async listInvoicesByCustomer(customerId: string): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });
      return invoices.data;
    } catch (error) {
      console.error('Error listing invoices:', error);
      throw error;
    }
  }
}
