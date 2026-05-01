import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import { CorePrismaService } from '@weats/database';
import { StripeService } from '@weats/integrations';
import { Establishment, User } from '@weats/types';

export type NormalizedFeature =
    | { type: 'BOOLEAN'; enabled: boolean }
    | { type: 'QUANTITY'; limit: number };

export interface NormalizedPlan {
    id: string;
    name: string;
    features: Record<string, NormalizedFeature>;
}

@Injectable()
export class EstablishmentSubscriptionService {
    private readonly logger = new Logger(EstablishmentSubscriptionService.name);

    constructor(
        @Inject("APP_URL")
        private readonly appUrl: string,
        private readonly prisma: CorePrismaService,
        private readonly stripeService: StripeService,
    ) { }

    async getPlan(establishmentId: string): Promise<NormalizedPlan | null> {
        const subscription = await this.prisma.subscription.findUnique({
            where: { establishmentId },
            include: {
                planCycle: {
                    include: {
                        plan: {
                            include: {
                                features: {
                                    include: { feature: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!subscription) return null;

        const plan = subscription.planCycle.plan;

        const features: Record<string, NormalizedFeature> = {};

        for (const f of plan.features) {
            const featureName = f.feature.name;

            if (f.feature.type === 'BOOLEAN') {
                features[featureName] = {
                    type: 'BOOLEAN',
                    enabled: f.valueBoolean ?? false,
                };
            } else if (f.feature.type === 'QUANTITY') {
                features[featureName] = {
                    type: 'QUANTITY',
                    limit: f.valueQuantity ?? 0,
                };
            }
        }

        return {
            id: plan.id,
            name: plan.name,
            features,
        };
    }

    async getSubscription(establishmentId: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { establishmentId },
            select: {
                status: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
                planCycle: {
                    select: {
                        cycle: true,
                        price: true,
                    },
                },
            },
        });

        return subscription;
    }

    async getInvoices(establishmentId: string) {
        try {
            const subscription = await this.prisma.subscription.findUnique({
                where: { establishmentId },
                select: {
                    stripeCustomerId: true,
                },
            });

            if (!subscription || !subscription.stripeCustomerId) {
                // Return empty invoices if no subscription found
                return {
                    invoices: [],
                    total: 0,
                };
            }

            const stripeInvoices = await this.stripeService.listInvoicesByCustomer(
                subscription.stripeCustomerId,
            );

            const invoices = stripeInvoices.map((invoice) => {
                const subscriptionId =
                    (invoice as any).subscription as string ||
                    invoice.lines.data[0]?.parent?.subscription_item_details?.subscription;

                return {
                    id: invoice.id,
                    customerId: invoice.customer as string,
                    establishmentId,
                    stripeInvoiceId: invoice.id,
                    subscriptionId: subscriptionId || null,
                    amountPaid: invoice.amount_paid,
                    status: invoice.status,
                    createdAt: new Date(invoice.created * 1000),
                    hosted_invoice_url: invoice.hosted_invoice_url,
                };
            });

            return {
                invoices,
                total: invoices.length,
            };
        } catch (error) {
            this.logger.error('Error fetching invoices:', error);
            throw new RpcException({
                message: 'STRIPE_FETCH_ERROR',
                code: 500,
            });
        }
    }

    async subscribeToPlan(planCycleId: string, establishment: Establishment) {
        const plan = await this.prisma.planCycle.findUnique({
            where: { id: planCycleId },
            select: { priceId: true },
        });

        if (!plan) {
            throw new RpcException({
                status: 404,
                message: ERRORS.PLAN_NOT_FOUND,
                code: ERRORS.PLAN_NOT_FOUND,
            });
        }

        const checkoutSession = await this.stripeService.createCheckoutSession({
            customerId: establishment.stripeCustomerId,
            priceId: plan.priceId,
            successUrl: `${this.appUrl}/establishment/${establishment.id}`,
            cancelUrl: `${this.appUrl}/establishment/${establishment.id}/subscription`,
            metadata: { establishmentId: establishment.id },
        });

        return { checkoutUrl: checkoutSession };
    }

    async getPortalSession(establishmentId: string) {
        const establishment = await this.prisma.establishment.findUnique({
            where: { id: establishmentId },
            select: { id: true, stripeCustomerId: true },
        });

        if (!establishment) {
            throw new RpcException({
                status: 404,
                message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                code: ERRORS.ESTABLISHMENT_NOT_FOUND,
            });
        }

        const portalUrl = await this.stripeService.getPortalSession({
            customerId: establishment.stripeCustomerId,
            returnUrl: `${this.appUrl}/establishment/${establishment.id}/subscription`,
        });

        return { url: portalUrl };
    }

    async cancelSubscription(establishmentId: string, user: User) {
        const establishment = await this.prisma.establishment.findUnique({
            where: { id: establishmentId, ownerId: user.id },
        });

        if (!establishment) {
            throw new RpcException({
                status: 404,
                message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                code: ERRORS.ESTABLISHMENT_NOT_FOUND,
            });
        }

        const subscription = await this.prisma.subscription.findUnique({
            where: { establishmentId: establishment.id },
        });

        if (!subscription) {
            throw new RpcException({
                status: 404,
                message: ERRORS.SUBSCRIPTION_NOT_FOUND,
                code: ERRORS.SUBSCRIPTION_NOT_FOUND,
            });
        }

        const stripeSubscription = await this.stripeService.getSubscriptionById(
            subscription.stripeSubscriptionId,
        );

        if (!stripeSubscription) {
            throw new RpcException({
                status: 404,
                message: ERRORS.STRIPE_SUBSCRIPTION_NOT_FOUND,
                code: ERRORS.STRIPE_SUBSCRIPTION_NOT_FOUND,
            });
        }

        await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);

        return { success: true };
    }


}
