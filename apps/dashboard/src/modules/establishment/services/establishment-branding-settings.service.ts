import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import {
    EstablishmentBrandingDto, EstablishmentMetadataDto,
    EstablishmentSocialMediaDto,
    UpdateEstablishmentBrandingSettingsDto
} from '@weats/contracts';
import { CorePrismaService } from '@weats/database';
import { CacheService } from '@weats/cache';
import { Establishment } from '@weats/types';

@Injectable()
export class EstablishmentBrandingSettingsService {
    private readonly logger = new Logger(EstablishmentBrandingSettingsService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly cacheService: CacheService,
    ) { }

    async getEstablishmentBrandingSettings(id: string) {
        const establishment = await this.prisma.establishment.findUnique({
            where: { id },
            select: {
                tiktokUrl: true,
                instagramUrl: true,
                facebookUrl: true,
                tripAdvisorUrl: true,
                googleReviewUrl: true,
                websiteUrl: true,
                logoImage: {
                    select: { id: true, url: true },
                },
                bannerImage: {
                    select: { id: true, url: true },
                },
                metadata: {
                    select: {
                        title: true,
                        shortName: true,
                        description: true,
                        ogImage: { select: { id: true, url: true } },
                    },
                },
                favicons: {
                    include: { image: { select: { id: true, url: true } } },
                },
            },
        });

        if (!establishment) {
            throw new RpcException({
                status: 404,
                message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                code: ERRORS.ESTABLISHMENT_NOT_FOUND,
            });
        }
        return {
            branding: {
                logoImage: establishment.logoImage,
                bannerImage: establishment.bannerImage,
            },
            socials: {
                websiteUrl: establishment.websiteUrl,
                tiktokUrl: establishment.tiktokUrl,
                instagramUrl: establishment.instagramUrl,
                facebookUrl: establishment.facebookUrl,
                tripAdvisorUrl: establishment.tripAdvisorUrl,
                googleReviewUrl: establishment.googleReviewUrl,
            },
            metadata: {
                title: establishment.metadata?.title || null,
                shortName: establishment.metadata?.shortName || null,
                description: establishment.metadata?.description || null,
                ogImage: establishment.metadata?.ogImage,
            },
            favicons: {
                faviconIco:
                    establishment.favicons.find(
                        (favicon) =>
                            favicon.role === 'favicon.ico' ||
                            favicon.role === 'favicon-16x16.png',
                    )?.image.url || null,
                favicon32x32Png:
                    establishment.favicons.find(
                        (favicon) => favicon.role === 'favicon-32x32.png',
                    )?.image.url || null,
                appleTouchIconPng:
                    establishment.favicons.find(
                        (favicon) => favicon.role === 'apple-touch-icon.png',
                    )?.image.url || null,
                androidChrome192x192Png:
                    establishment.favicons.find(
                        (favicon) => favicon.role === 'android-chrome-192x192.png',
                    )?.image.url || null,
                androidChrome512x512Png:
                    establishment.favicons.find(
                        (favicon) => favicon.role === 'android-chrome-512x512.png',
                    )?.image.url || null,
            },
        };
    }

    async updateEstablishmentBrandingSettings(
        establishment: Establishment,
        dto: UpdateEstablishmentBrandingSettingsDto,
    ) {
        try {
            let result;

            // 1. Executa a atualização baseada na secção
            switch (dto.section) {
                case 'branding':
                    result = await this.updateBranding(establishment.id, dto.branding);
                    this.cacheService.clearCoreCache(establishment.slug);
                    break;

                case 'socials':
                    result = await this.updateSocials(establishment.id, dto.socials);
                    this.cacheService.clearCoreCache(establishment.slug);
                    break;
                case 'metadata':
                    result = await this.updateMetadata(establishment.id, dto.metadata);
                    this.cacheService.clearCoreCache(establishment.slug);
                    break;
                default:
                    throw new RpcException({
                        status: 400,
                        message: 'Invalid section provided',
                        code: ERRORS.BAD_REQUEST,
                    });
            }

            return result;
        } catch (error) {
            if (error instanceof RpcException) throw error;

            this.logger.error(`[BrandingSettings] Update failed:`, error);

            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    private async updateBranding(id: string, data: EstablishmentBrandingDto) {
        return this.prisma.establishment.update({
            where: { id },
            data: {
                logoImageId: data.logoImage?.id ?? null,
                bannerImageId: data.bannerImage?.id ?? null,
            },
        });
    }

    private async updateSocials(id: string, data: EstablishmentSocialMediaDto) {
        return this.prisma.establishment.update({
            where: { id },
            data: {
                instagramUrl: data.instagramUrl,
                tiktokUrl: data.tiktokUrl,
                facebookUrl: data.facebookUrl,
                tripAdvisorUrl: data.tripAdvisorUrl,
                googleReviewUrl: data.googleReviewUrl,
                websiteUrl: data.websiteUrl,
            },
        });
    }

    private async updateMetadata(id: string, data: EstablishmentMetadataDto) {
        return this.prisma.establishmentMetadata.upsert({
            where: { establishmentId: id },
            update: {
                title: data.title,
                shortName: data.shortName,
                description: data.description,
                ogImageId: data.ogImage?.id ?? null,
            },
            create: {
                establishmentId: id,
                title: data.title,
                shortName: data.shortName,
                description: data.description,
                ogImageId: data.ogImage?.id ?? null,
            },
        });
    }
}
