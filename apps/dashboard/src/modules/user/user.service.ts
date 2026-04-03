import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CorePrismaService } from '@weats/database';
import { StripeService } from '@weats/integrations';
import { Establishment } from '@weats/types/establishment';
import { ERRORS } from '@weats/common';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly stripe: StripeService,
        @Inject('APP_URL') private readonly appUrl: string,
    ) { }

    async getEstablishments(userId: string) {
        const establishments = await this.prisma.establishment.findMany({
            where: { ownerId: userId },
            select: {
                id: true,
                name: true,
                type: true,
                slug: true,
                isOnline: true,
                subscription: {
                    select: {
                        status: true,
                        currentPeriodEnd: true,
                        cancelAtPeriodEnd: true,
                    },
                },
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                countryCode: true,
                phoneNumber: true,

                primaryLanguage: true,
                availableLanguages: true,

                instagramUrl: true,
                tiktokUrl: true,
                facebookUrl: true,
                googleReviewUrl: true,
                tripAdvisorUrl: true,
                logoImage: {
                    select: { id: true, url: true },
                },
                bannerImage: {
                    select: { id: true, url: true },
                },
            },
        });

        return establishments;
    }

    async manageEstablishmentSubscription(establishment: Establishment) {
        if (!establishment.stripeCustomerId) {
            throw new RpcException({
                status: 400,
                message: ERRORS.STRIPE_CUSTOMER_ID_MISSING,
                code: ERRORS.STRIPE_CUSTOMER_ID_MISSING,
            });
        }

        const portalUrl = await this.stripe.getPortalSession({
            customerId: establishment.stripeCustomerId,
            returnUrl: `${this.appUrl}/establishment/${establishment.id}`,
        });

        return { checkoutUrl: portalUrl };
    }
}
