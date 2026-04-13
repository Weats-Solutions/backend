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
import { MenuUtilsService } from '@weats/common/utils/modules/menu/menu-utils.service';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class LandingpageService {
    constructor(
        private readonly prisma: CorePrismaService,
        private readonly appConfigService: AppConfigService,
        private readonly menuService: MenuService,
        private readonly menuUtilsService: MenuUtilsService,
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
            if (error instanceof RpcException) throw error;
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
                    metadata: {
                        select: { title: true, shortName: true, description: true, ogImage: { select: { url: true } } }
                    },
                    favicons: {
                        include: { image: { select: { url: true } } }
                    }
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
                metadata: {
                    title: establishment.metadata?.title || null,
                    shortName: establishment.metadata?.shortName || null,
                    description: establishment.metadata?.description || null,
                    ogImage: establishment.metadata?.ogImage?.url || null,
                },
                favicons: {
                    favicon16x16: establishment.favicons.find((favicon) => favicon.role === 'favicon-16x16.png')?.image?.url || null,
                    favicon32x32Png: establishment.favicons.find((favicon) => favicon.role === 'favicon-32x32.png')?.image?.url || null,
                    appleTouchIconPng: establishment.favicons.find((favicon) => favicon.role === 'apple-touch-icon.png')?.image?.url || null,
                    androidChrome192x192Png: establishment.favicons.find((favicon) => favicon.role === 'android-chrome-192x192.png')?.image?.url || null,
                    androidChrome512x512Png: establishment.favicons.find((favicon) => favicon.role === 'android-chrome-512x512.png')?.image?.url || null,
                },
            };

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
                socials: {
                    tiktokUrl: establishment.tiktokUrl,
                    instagramUrl: establishment.instagramUrl,
                    facebookUrl: establishment.facebookUrl,
                    tripAdvisorUrl: establishment.tripAdvisorUrl,
                    googleReviewUrl: establishment.googleReviewUrl,
                    websiteUrl: establishment.websiteUrl,
                },
                takeway: true,
                reservations: true,
            };

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
                    schedule: {
                        include: {
                            days: {
                                include: {
                                    intervals: true
                                }
                            }
                        }
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

            if (
                !Object.values(establishment.availableLanguages)
                    .includes(lang as EstablishmentLanguage)
            ) {
                lang = establishment.primaryLanguage;
            }

            if (targetId) {
                if (!establishment.schedule) {
                    throw new RpcException({
                        status: 400,
                        message: "teste",
                        code: "teste",
                    });
                }
                console.log(establishment.schedule)
                console.log(establishment.timezone)

                if (!isScheduleOpenNow(
                    establishment.schedule,
                    establishment.timezone
                )) {
                    console.log("Establishment is closed" + isScheduleOpenNow(
                        establishment.schedule,
                        establishment.timezone
                    ));
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
                    position: true,
                    type: true,
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
            if (error instanceof RpcException) throw error;
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


            return this.menuService.getMenuContent(menuId, establishment.id, lang);
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
            if (error instanceof RpcException) throw error;
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
            let shouldClearCache = false;

            if (themeId) {
                // Criar novo tema
                theme = await this.prisma.theme.create({
                    data: {
                        name,
                        config,
                        establishment: {
                            connect: { id: establishment.id },
                        },
                    },
                });

                // Ao criar e definir como ativo, a cache deve ser limpa
                await this.prisma.establishment.update({
                    where: { id: establishment.id },
                    data: { activeThemeId: theme.id },
                });

                shouldClearCache = true;
            } else {
                // Atualizar tema existente
                const existingEstablishment = await this.prisma.establishment.findUnique({
                    where: { id: establishment.id },
                    select: { activeThemeId: true }, // Buscar o ID ativo diretamente
                });

                if (existingEstablishment?.activeThemeId) {
                    theme = await this.prisma.theme.update({
                        where: { id: existingEstablishment.activeThemeId },
                        data: { name, config },
                    });

                    // Se atualizámos o tema que está ativo, marcamos para limpar cache
                    shouldClearCache = true;
                } else {
                    // Fallback: criar novo se não existir ativo
                    theme = await this.prisma.theme.create({
                        data: {
                            name,
                            config,
                            establishment: { connect: { id: establishment.id } },
                        },
                    });

                    await this.prisma.establishment.update({
                        where: { id: establishment.id },
                        data: { activeThemeId: theme.id },
                    });

                    shouldClearCache = true;
                }
            }

            // Só limpa a cache se o tema afetado for o tema ativo do estabelecimento
            if (shouldClearCache) {
                this.menuUtilsService.clearMenuCacheAsync('theme', establishment.slug);
            }

            return theme;
        } catch (error) {
            if (error instanceof RpcException) throw error;
            console.error(error);
            throw new RpcException({
                status: 400,
                message: 'Erro ao atualizar o tema.',
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
            if (error instanceof RpcException) throw error;
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
            this.menuUtilsService.clearMenuCacheAsync('theme', establishment.slug);
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
