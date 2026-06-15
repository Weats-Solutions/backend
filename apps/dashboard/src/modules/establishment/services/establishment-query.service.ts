import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS, normalizeSchedule } from '@weats/common';
import { CorePrismaService } from '@weats/database';
import { CacheService, dashboardEstKey } from '@weats/cache';
import { EstablishmentSubscriptionService } from './establishment-subscription.service';

@Injectable()
export class EstablishmentQueryService {
    private readonly logger = new Logger(EstablishmentQueryService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly cache: CacheService,
        private readonly establishmentSubscriptionService: EstablishmentSubscriptionService,
    ) { }

    /**
     * Obtém os dados core do estabelecimento para o dashboard.
     * Centraliza a consulta e a cache para evitar hits duplicados na BD.
     */
    private async getEstablishmentCore(id: string) {
        const cacheKey = dashboardEstKey(id);

        const establishment = await this.cache.wrap(cacheKey, 300, async () => {
            return this.prisma.establishment.findUnique({
                where: { id },
                include: {
                    logoImage: { select: { id: true, url: true } },
                    bannerImage: { select: { id: true, url: true } },
                    subscription: true,
                    schedule: {
                        include: { days: { include: { intervals: true } } },
                    },
                },
            });
        });

        if (!establishment) {
            throw new RpcException({
                code: 404,
                message: ERRORS.ESTABLISHMENT_NOT_FOUND,
            });
        }

        return establishment;
    }

    async getEstablishmentInfo(id: string) {
        const establishment = await this.getEstablishmentCore(id);

        const plan = await this.establishmentSubscriptionService.getPlan(id);
        const subscription = await this.establishmentSubscriptionService.getSubscription(id);

        return {
            id: establishment.id,
            name: establishment.name,
            type: establishment.type,
            slug: establishment.slug,
            isDemo: establishment.isDemo,
            address: establishment.address,
            city: establishment.city,
            state: establishment.state,
            zipCode: establishment.zipCode,
            country: establishment.country,
            countryCode: establishment.countryCode,
            phoneNumber: establishment.phoneNumber,
            primaryLanguage: establishment.primaryLanguage,
            availableLanguages: establishment.availableLanguages,
            instagramUrl: establishment.instagramUrl,
            tiktokUrl: establishment.tiktokUrl,
            facebookUrl: establishment.facebookUrl,
            googleReviewUrl: establishment.googleReviewUrl,
            tripAdvisorUrl: establishment.tripAdvisorUrl,
            logoImage: establishment.logoImage,
            bannerImage: establishment.bannerImage,
            subscription,
            plan,
        };
    }

    async getEstablishmentAccess(id: string) {
        const establishment = await this.getEstablishmentCore(id);

        const hasActiveSubscription =
            establishment.subscription?.status === 'ACTIVE' ||
            establishment.subscription?.status === 'TRIALING' ||
            establishment.isDemo;
        
            

        return {
            hasAccess: true,
            hasActiveSubscription,
            hasCallStaffModule: establishment.callStaffModule
        };
    }

    async getEstablishmentSchedule(id: string) {
        const establishment = await this.getEstablishmentCore(id);

        if (!establishment.schedule) {
            return null;
        }

        return normalizeSchedule(establishment.schedule);
    }

}
