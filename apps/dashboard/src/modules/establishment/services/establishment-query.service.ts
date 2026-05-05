import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS, normalizeSchedule } from '@weats/common';
import { CorePrismaService } from '@weats/database';
import { EstablishmentSubscriptionService } from './establishment-subscription.service';

@Injectable()
export class EstablishmentQueryService {
    private readonly logger = new Logger(EstablishmentQueryService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly establishmentSubscriptionService: EstablishmentSubscriptionService,
    ) { }

    async getEstablishmentInfo(id: string) {
        const establishment = await this.prisma.establishment.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                type: true,
                slug: true,
                isOnline: true,
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

        if (!establishment) {
            throw new RpcException({
                code: 404,
                message: ERRORS.ESTABLISHMENT_NOT_FOUND,
            });
        }

        const plan = await this.establishmentSubscriptionService.getPlan(id);
        const subscription = await this.establishmentSubscriptionService.getSubscription(id);

        return { ...establishment, subscription, plan };
    }

    async getEstablishmentAccess(id: string) {
        const establishment = await this.prisma.establishment.findUnique({
            where: { id },
            select: {
                id: true,
                callStaffModule: true,
                subscription: true,
            },
        });

        if (!establishment) {
            throw new RpcException({
                code: 404,
                message: ERRORS.ESTABLISHMENT_NOT_FOUND,
            });
        }

        const hasActiveSubscription = establishment.subscription?.status === 'ACTIVE' || establishment.subscription?.status === 'TRIALING';

        this.logger.log({
            hasAccess: true,
            hasActiveSubscription,
            hasCallStaffModule: establishment.callStaffModule,
        })

        return { hasAccess: true, hasActiveSubscription, hasCallStaffModule: establishment.callStaffModule };
    }

    async getEstablishmentSchedule(id: string) {
        const establishment = await this.prisma.establishment.findUniqueOrThrow({
            where: { id },
            include: {
                schedule: {
                    include: { days: { include: { intervals: true } } },
                },
            },
        });

        if (!establishment.schedule) {
            return null;
        }

        return normalizeSchedule(establishment.schedule);
    }

}
