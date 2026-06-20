import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CacheService } from '@weats/cache';
import { ERRORS } from '@weats/common';
import { FeatureUsageService } from '@weats/common/feature/feature-usage.service';
import { UpdateEstablishmentModuleSettingsDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-module-settings.dto';
import { CorePrismaService } from '@weats/database';
import { feature } from '@weats/types';

@Injectable()
export class EstablishmentModuleSettingsService {
    private readonly logger = new Logger(EstablishmentModuleSettingsService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly cacheService: CacheService,
        private readonly featureUsageService: FeatureUsageService,
    ) { }

    async getEstablishmentModuleSettings(id: string) {
        return await this.prisma.establishment.findUnique({
            where: { id },
            select: {
                myPageModule: true,
                menusModule: true,
                callStaffModule: true,
                callStaffOptions: true,
                reservationsModule: true,
                reservationsPlatform: true,
                reservationsLink: true,
                externalLinksModule: true,
                externalLinks: {
                    orderBy: {
                        position: 'asc',
                    },
                    include: {
                        translations: true,
                    },
                },
            }
        })
    }

    async updateEstablishmentModuleSettings(id: string, updateEstablishmentModuleSettingsDto: UpdateEstablishmentModuleSettingsDto) {
        if (updateEstablishmentModuleSettingsDto.callStaffModule) {
            const { enabled } = await this.featureUsageService.getUsageAndLimit(
                feature.call_staff,
                id,
            );
            if (!enabled) {
                throw new BadRequestException({
                    message: 'Feature call staff not enabled for your plan',
                    code: ERRORS.FEATURE_NOT_ENABLED,
                });
            }
        }

        if (updateEstablishmentModuleSettingsDto.reservationsModule) {
            const { enabled } = await this.featureUsageService.getUsageAndLimit(
                feature.reservations,
                id,
            );
            if (!enabled) {
                throw new BadRequestException({
                    message: 'Feature reservations not enabled for your plan',
                    code: ERRORS.FEATURE_NOT_ENABLED,
                });
            }
        }

        if (updateEstablishmentModuleSettingsDto.externalLinksModule) {
            const { enabled, limit } = await this.featureUsageService.getUsageAndLimit(
                feature.external_links,
                id,
            );
            if (enabled === false || (limit !== null && limit <= 0)) {
                throw new BadRequestException({
                    message: 'Feature external links not enabled for your plan',
                    code: ERRORS.FEATURE_NOT_ENABLED,
                });
            }
            if (updateEstablishmentModuleSettingsDto.externalLinks && limit !== null && updateEstablishmentModuleSettingsDto.externalLinks.length > limit) {
                throw new BadRequestException({
                    message: `You cannot have more than ${limit} external links`,
                    code: ERRORS.FEATURE_LIMIT_REACHED,
                });
            }
        }

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                if (updateEstablishmentModuleSettingsDto.externalLinks !== undefined) {
                    const incomingLinks = updateEstablishmentModuleSettingsDto.externalLinks;
                    const incomingIds = incomingLinks.map(l => l.id).filter(Boolean) as string[];

                    // Delete links not in incoming links
                    await tx.externalLink.deleteMany({
                        where: {
                            establishmentId: id,
                            id: { notIn: incomingIds }
                        }
                    });

                    // Upsert each incoming link
                    let position = 0;
                    for (const link of incomingLinks) {
                        if (link.id) {
                            // Update
                            await tx.externalLink.update({
                                where: { id: link.id },
                                data: {
                                    icon: link.icon,
                                    url: link.url,
                                    position,
                                    translations: {
                                        deleteMany: {},
                                        create: link.translations.map(t => ({
                                            locale: t.locale,
                                            name: t.name,
                                            description: t.description,
                                        }))
                                    }
                                }
                            });
                        } else {
                            // Create
                            await tx.externalLink.create({
                                data: {
                                    establishmentId: id,
                                    icon: link.icon,
                                    url: link.url,
                                    position,
                                    translations: {
                                        create: link.translations.map(t => ({
                                            locale: t.locale,
                                            name: t.name,
                                            description: t.description,
                                        }))
                                    }
                                }
                            });
                        }
                        position++;
                    }
                }

                const establishment = await tx.establishment.update({
                    where: { id },
                    data: {
                        myPageModule: updateEstablishmentModuleSettingsDto.myPageModule,
                        menusModule: updateEstablishmentModuleSettingsDto.menusModule,
                        callStaffModule: updateEstablishmentModuleSettingsDto.callStaffModule,
                        reservationsModule: updateEstablishmentModuleSettingsDto.reservationsModule,
                        reservationsPlatform: updateEstablishmentModuleSettingsDto.reservationsPlatform,
                        reservationsLink: updateEstablishmentModuleSettingsDto.reservationsLink,
                        externalLinksModule: updateEstablishmentModuleSettingsDto.externalLinksModule,
                        ...(updateEstablishmentModuleSettingsDto.callStaffOptions !== undefined && {
                            callStaffOptions: updateEstablishmentModuleSettingsDto.callStaffOptions,
                        }),
                    },
                    select: {
                        slug: true,
                        myPageModule: true,
                        menusModule: true,
                        callStaffModule: true,
                        callStaffOptions: true,
                        reservationsModule: true,
                        reservationsPlatform: true,
                        reservationsLink: true,
                        externalLinksModule: true,
                        externalLinks: {
                            orderBy: {
                                position: 'asc',
                            },
                            include: {
                                translations: true,
                            }
                        }
                    }
                });

                return establishment;
            });

            await this.cacheService.clearCatalogEstablishmentCache(result.slug);
            await this.cacheService.clearDashboardEstablishmentCache(id);

            return {
                myPageModule: result.myPageModule,
                menusModule: result.menusModule,
                callStaffModule: result.callStaffModule,
                callStaffOptions: result.callStaffOptions,
                reservationsModule: result.reservationsModule,
                reservationsPlatform: result.reservationsPlatform,
                reservationsLink: result.reservationsLink,
                externalLinksModule: result.externalLinksModule,
                externalLinks: result.externalLinks,
            }
        } catch (error) {
            this.logger.error(`Failed to update establishment module settings: ${error}`);
            throw new BadRequestException(ERRORS.BAD_REQUEST);
        }
    }
}




