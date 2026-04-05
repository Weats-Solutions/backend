import { Injectable } from '@nestjs/common';
import { CorePrismaService, Schedule } from '@weats/database';
import { EstablishmentLanguage } from '@weats/database';
import { RpcException } from '@nestjs/microservices';
import { ERRORS, normalizeSchedule, clearMenuCacheAsync } from '@weats/common';
import { UpdateThemeSettingsDto } from '@weats/contracts/dashboard/dtos/theme/update-theme-settings.dto';
import { Establishment, EupagoMultibancoResponse } from '@weats/types';
import { AppConfigService } from '@weats/configs/app-config.service';
import { MenuService } from '../menu/menu.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { isScheduleOpenNow } from '@weats/common/utils/schedule.utils';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class LandingpageService {
    constructor(
        private readonly prisma: CorePrismaService,
        private readonly appConfigService: AppConfigService,
        private readonly menuService: MenuService,
        //@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async getLandingpage(establishmentSlug: string, lang: string, targetId?: string) {
        try {
            const establishment = await this.prisma.establishment.findUnique({
                where: { slug: establishmentSlug },
                include: {
                    activeTheme: {
                        select: {
                            id: true,
                            name: true,
                            config: true,
                        }
                    },
                    logoImage: true,
                    bannerImage: true,
                    schedule: true,
                },
            });

            if (!establishment) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                    code: ERRORS.ESTABLISHMENT_NOT_FOUND,
                });
            }

            if (
                !Object.values(establishment.availableLanguages)
                    .includes(lang as EstablishmentLanguage)
            ) {
                lang = establishment.primaryLanguage;
            }

            // 🔥 NOVA REGRA: ignorar horários se NÃO houver targetId
            let isEstablishmentOpenNow = true;

            if (targetId) {
                if (!establishment.schedule) {
                    return {
                        name: establishment.name,
                        themeName: establishment.activeTheme?.name,
                        themeConfig: establishment.activeTheme?.config,
                        logo: establishment.logoImage?.url || null,
                        banner: establishment.bannerImage?.url || null,
                        primaryLanguage: establishment.primaryLanguage,
                        availableLocales: establishment.availableLanguages,
                        isOpen: false,
                        message: 'O estabelecimento está fechado no momento',
                        menus: [],
                    };
                }

                isEstablishmentOpenNow = isScheduleOpenNow(
                    establishment.schedule,
                    establishment.timezone
                );

                if (!isEstablishmentOpenNow) {
                    return {
                        name: establishment.name,
                        themeName: establishment.activeTheme?.name,
                        themeConfig: establishment.activeTheme?.config,
                        logo: establishment.logoImage?.url || null,
                        banner: establishment.bannerImage?.url || null,
                        primaryLanguage: establishment.primaryLanguage,
                        availableLocales: establishment.availableLanguages,
                        isOpen: false,
                        message: 'O estabelecimento está fechado no momento',
                        menus: [],
                    };
                }
            }

            const menus = await this.prisma.menu.findMany({
                where: {
                    establishmentId: establishment.id,
                    isVisible: true,
                },
                select: {
                    id: true,
                    isHighlighted: true,
                    isVisible: true,
                    schedule: {
                        include: { days: { include: { intervals: true } } }
                    },
                    translations: {
                        where: { locale: lang },
                    },
                },
            });

            // 🔥 NOVA REGRA: só filtra horários dos menus se houver targetId
            const visibleAndOpenMenus = targetId
                ? menus.filter((menu) => {
                    if (!menu.schedule) return false;
                    return isScheduleOpenNow(menu.schedule, establishment.timezone);
                })
                : menus;

            return {
                name: establishment.name,
                themeName: establishment.activeTheme?.name,
                themeConfig: establishment.activeTheme?.config,
                logo: establishment.logoImage?.url || null,
                banner: establishment.bannerImage?.url || null,
                primaryLanguage: establishment.primaryLanguage,
                availableLocales: establishment.availableLanguages,
                isOpen: true,
                menus: visibleAndOpenMenus || [],
            };

        } catch (error) {
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async getLandingpageTheme(establishmentSlug: string) {
        try {
            const establishment = await this.prisma.establishment.findUnique({
                where: { slug: establishmentSlug },
                include: {
                    activeTheme: {
                        select: {
                            id: true,
                            name: true,
                            config: true,
                        }
                    },
                    logoImage: true,
                    bannerImage: true,
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
                themeName: establishment.activeTheme?.name,
                themeConfig: establishment.activeTheme?.config,
                logo: establishment.logoImage?.url || null,
                banner: establishment.bannerImage?.url || null,
            };

        } catch (error) {
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async getEstablishmentSettings(establishmentSlug: string) {
        try {
            const establishment = await this.prisma.establishment.findUnique({
                where: { slug: establishmentSlug },
                include: {
                    schedule: { include: { days: { include: { intervals: true } } } }
                }
            });

            if (!establishment) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                    code: ERRORS.ESTABLISHMENT_NOT_FOUND,
                });
            }

            return {
                id: establishment.id,
                name: establishment.name,
                primaryLanguage: establishment.primaryLanguage,
                availableLocales: establishment.availableLanguages,
                currency: establishment.currency,
                timezone: establishment.timezone,
                schedule: normalizeSchedule(establishment.schedule ?? undefined),
                takeway: true,
                reservations: true,
            };

        } catch (error) {
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async getMenuList(establishmentSlug: string, lang: string, targetId?: string) {
        try {
            const establishment = await this.prisma.establishment.findUnique({
                where: { slug: establishmentSlug },
                include: {
                    activeTheme: {
                        select: {
                            id: true,
                            name: true,
                            config: true,
                        }
                    },
                    logoImage: true,
                    bannerImage: true,
                    schedule: true,
                },
            });

            if (!establishment) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                    code: ERRORS.ESTABLISHMENT_NOT_FOUND,
                });
            }

            if (
                !Object.values(establishment.availableLanguages)
                    .includes(lang as EstablishmentLanguage)
            ) {
                lang = establishment.primaryLanguage;
            }

            if (targetId) {
                if (!establishment.schedule || !isScheduleOpenNow(
                    establishment.schedule,
                    establishment.timezone
                )) {
                    throw new RpcException({
                        status: 400,
                        message: ERRORS.ESTABLISHMENT_CLOSED,
                        code: ERRORS.ESTABLISHMENT_CLOSED,
                    });
                }
            }

            const menus = await this.prisma.menu.findMany({
                where: {
                    establishmentId: establishment.id,
                    isVisible: true,
                },
                select: {
                    id: true,
                    isHighlighted: true,
                    isVisible: true,
                    schedule: {
                        include: { days: { include: { intervals: true } } }
                    },
                    translations: {
                        where: { locale: lang },
                    },
                },
            });

            // 🔥 NOVA REGRA: só filtra horários dos menus se houver targetId
            const visibleAndOpenMenus = targetId
                ? menus.filter((menu) => {
                    if (!menu.schedule) return false;
                    return isScheduleOpenNow(menu.schedule, establishment.timezone);
                })
                : menus;

            return {
                menus: visibleAndOpenMenus || [],
            };

        } catch (error) {
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }


    async getMenuContent(establishmentSlug: string, menuId: string, lang: EstablishmentLanguage, targetId?: string) {
        try {

            // Ownership check: ensure the menu belongs to this establishment
            const menu = await this.prisma.menu.findFirst({
                where: {
                    id: menuId,
                    establishment: { slug: establishmentSlug },
                },
                select: { id: true },
            });

            const establishment = await this.prisma.establishment.findUnique({
                where: { slug: establishmentSlug },
            });

            if (!establishment) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                    code: ERRORS.ESTABLISHMENT_NOT_FOUND,
                });
            }

            if (
                !Object.values(establishment.availableLanguages)
                    .includes(lang as EstablishmentLanguage)
            ) {
                lang = establishment.primaryLanguage;
            }

            if (!menu) {
                throw new RpcException({ status: 404, message: ERRORS.ESTABLISHMENT_NOT_FOUND, code: ERRORS.ESTABLISHMENT_NOT_FOUND });
            }

            return this.menuService.getMenuContent(menuId, lang);
        } catch (error) {
            if (error instanceof RpcException) throw error;
            throw new RpcException({ status: 400, message: ERRORS.BAD_REQUEST, code: ERRORS.BAD_REQUEST });
        }
    }

    async getTheme(payload: { establishmentId: string }) {
        try {
            const establishment = await this.prisma.establishment.findUnique({
                where: { id: payload.establishmentId },
                select: {
                    activeTheme: {
                        select: {
                            name: true,
                            config: true,
                        }
                    },
                },
            });

            return establishment?.activeTheme ?? null;
        } catch (error) {
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async updateTheme(payload: { updateThemeSettingsDto: UpdateThemeSettingsDto, establishment: Establishment }) {
        try {
            const { updateThemeSettingsDto, establishment } = payload;
            const { name, config, themeId } = updateThemeSettingsDto;

            let theme;

            if (themeId) {
                // Create new theme (themeId is provided when creating new)
                theme = await this.prisma.theme.create({
                    data: {
                        name,
                        config,
                        establishment: {
                            connect: { id: establishment.id },
                        },
                    },
                });

                await this.prisma.establishment.update({
                    where: { id: establishment.id },
                    data: { activeThemeId: theme.id },
                });
            } else {
                // Update existing theme
                const existingEstablishment = await this.prisma.establishment.findUnique({
                    where: { id: establishment.id },
                    select: {
                        activeTheme: {
                            select: {
                                id: true,
                            }
                        },
                    },
                });

                if (existingEstablishment?.activeTheme) {
                    theme = await this.prisma.theme.update({
                        where: { id: existingEstablishment.activeTheme.id },
                        data: { name, config },
                    });
                } else {
                    // Fallback: create new theme if no active theme exists
                    theme = await this.prisma.theme.create({
                        data: {
                            name,
                            config,
                            establishment: {
                                connect: { id: establishment.id },
                            },
                        },
                    });

                    await this.prisma.establishment.update({
                        where: { id: establishment.id },
                        data: { activeThemeId: theme.id },
                    });
                }
            }

            // Clear menu cache using the shared utility function
            clearMenuCacheAsync(establishment.slug);

            return theme;
        } catch (error) {
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async getAvailableThemes(payload: { establishmentId: string }) {
        try {
            const themes = await this.prisma.theme.findMany({
                where: {
                    OR: [
                        { isDefault: true },
                        { establishmentId: payload.establishmentId }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    config: true,
                    isDefault: true,
                    establishmentId: true,
                }
            });

            return themes;
        } catch (error) {
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async setActiveTheme(payload: { establishmentId: string; themeId: string }) {
        try {
            const { establishmentId, themeId } = payload;

            // Verify theme exists
            const theme = await this.prisma.theme.findUnique({
                where: { id: themeId },
                select: { id: true, name: true, config: true }
            });

            if (!theme) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.NOT_FOUND,
                    code: ERRORS.NOT_FOUND,
                });
            }

            // Update establishment's active theme
            const establishment = await this.prisma.establishment.update({
                where: { id: establishmentId },
                data: {
                    activeThemeId: themeId,
                },
                select: { slug: true }
            });

            // Clear menu cache
            clearMenuCacheAsync(establishment.slug);

            return theme;
        } catch (error) {
            if (error instanceof RpcException) throw error;
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

}
