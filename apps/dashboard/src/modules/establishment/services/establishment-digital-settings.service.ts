import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS, RESERVED_DOMAINS } from '@weats/common';
import {
    EstablishmentAnalyticsDto,
    EstablishmentDomainDto, EstablishmentWifiDto,
    UpdateEstablishmentDigitalSettingsDto
} from '@weats/contracts';
import { CorePrismaService } from '@weats/database';
import { MenuUtilsService } from '@weats/common/utils/modules/menu/menu-utils.service';
import { Establishment } from '@weats/types';

@Injectable()
export class EstablishmentDigitalSettingsService {
    private readonly logger = new Logger(EstablishmentDigitalSettingsService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly menuUtilsService: MenuUtilsService,
    ) { }


    async getEstablishmentDigitalSettings(establishment: Establishment) {

        const establishmentData = await this.prisma.establishment.findUniqueOrThrow({
            where: { id: establishment.id },
            select: {
                slug: true,
                wifiSsid: true,
                wifiPassword: true,
                googleAnalyticsId: true,
            },
        });

        return {
            domain: {
                slug: establishmentData.slug,
            },
            wifi: {
                ssid: establishmentData.wifiSsid,
                password: establishmentData.wifiPassword,
            },
            analytics: {
                googleAnalyticsId: establishmentData.googleAnalyticsId,
            },
        };
    }


    async updateEstablishmentDigitalSettings(
        establishment: Establishment,
        updateEstablishmentDigitalSettingsDto: UpdateEstablishmentDigitalSettingsDto,
    ) {
        let result;

        switch (updateEstablishmentDigitalSettingsDto.section) {
            case 'domain':
                result = await this.updateDomain(
                    establishment,
                    updateEstablishmentDigitalSettingsDto.domain,
                );
                this.menuUtilsService.clearAllCacheAsync(establishment.slug);

                break;
            case 'wifi':
                result = await this.updateWifi(
                    establishment,
                    updateEstablishmentDigitalSettingsDto.wifi,
                );
                this.menuUtilsService.clearMenuCacheAsync('settings', establishment.slug);
                break;
            case 'analytics':
                result = await this.updateAnalytics(
                    establishment,
                    updateEstablishmentDigitalSettingsDto.analytics,
                );
                this.menuUtilsService.clearMenuCacheAsync('settings', establishment.slug);
                break;
            default:
                throw new RpcException({
                    status: 400,
                    message: 'Invalid section provided',
                    code: ERRORS.BAD_REQUEST,
                });
        }

        return result;
    }

    async updateDomain(
        establishment: Establishment,
        domainDto: EstablishmentDomainDto,
    ) {
        const domain = await this.verifyDomain(domainDto.slug);

        if (!domain.isAvailable) {
            throw new RpcException({
                status: 400,
                message: ERRORS.DOMAIN_NOT_AVAILABLE,
                code: 400,
            });
        }

        return this.prisma.establishment.update({
            where: { id: establishment.id },
            data: {
                slug: domainDto.slug,
            },
        });
    }

    async updateWifi(
        establishment: Establishment,
        wifiDto: EstablishmentWifiDto,
    ) {
        return this.prisma.establishment.update({
            where: { id: establishment.id },
            data: {
                wifiSsid: wifiDto.wifiSsid,
                wifiPassword: wifiDto.wifiPassword,
            },
        });
    }

    async updateAnalytics(
        establishment: Establishment,
        analyticsDto: EstablishmentAnalyticsDto,
    ) {
        return this.prisma.establishment.update({
            where: { id: establishment.id },
            data: {
                googleAnalyticsId: analyticsDto.googleAnalyticsId || null,
            },
        });
    }

    async verifyDomain(slug: string) {
        if (slug.length < 2 || slug.length > 50) {
            return {
                domain: slug,
                isAvailable: false,
            };
        }

        if (RESERVED_DOMAINS.includes(slug.toLowerCase())) {
            return {
                domain: slug,
                isAvailable: false,
            };
        }

        const establishment = await this.prisma.establishment.findUnique({
            where: { slug },
        });

        if (establishment) {
            return {
                domain: slug,
                isAvailable: false,
            };
        }

        return {
            domain: slug,
            isAvailable: true,
        };
    }

}

