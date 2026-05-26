import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ERRORS, isScheduleOpenNow, normalizeSchedule } from '@weats/common';
import { CorePrismaService, EstablishmentLanguage } from '@weats/database';
import { Logger } from '@nestjs/common';
import { CacheService, coreCacheKey, menuItemsCacheKey, menuListCacheKey } from '@weats/cache';
import { QrSessionTokenPayload } from './catalog.controller';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    private readonly cache: CacheService,
  ) { }

  /**
   * Obtém os dados core do estabelecimento para o catálogo.
   * Centraliza a consulta e a cache para evitar hits duplicados na BD.
   */
  private async getEstablishmentCore(slug: string) {
    const cacheKey = coreCacheKey(slug);

    const establishment = await this.cache.wrap(cacheKey, 3600, async () => {
      return this.prisma.establishment.findUnique({
        where: { slug },
        include: {
          activeTheme: {
            select: { id: true, name: true, config: true }
          },
          logoImage: true,
          bannerImage: true,
          metadata: {
            select: {
              title: true,
              shortName: true,
              description: true,
              ogImage: { select: { url: true } }
            }
          },
          favicons: {
            include: { image: { select: { url: true } } }
          },
          subscription: true,
          schedule: {
            include: { days: { include: { intervals: true } } }
          }
        },
      });
    });

    if (!establishment) {
      throw new NotFoundException(ERRORS.ESTABLISHMENT_NOT_FOUND);
    }

    return establishment;
  }

  /**
   * Valida se o estabelecimento pode ser visualizado publicamente.
   * Verifica Módulo Ativo + Subscrição Válida.
   */
  private validateEstablishment(establishment: any) {
    if (establishment.isDemo) {
      return;
    }

    if (!establishment.myPageModule) {
      this.logger.debug(`Establishment ${establishment.id} has no myPageModule`);
      throw new NotFoundException(ERRORS.NOT_FOUND);
    }

    const validStatuses = ['ACTIVE', 'TRIALING'];
    this.logger.debug(`Establishment ${establishment.id} subscription status: ${establishment.subscription?.status}`);
    if (!establishment.subscription || !validStatuses.includes(establishment.subscription.status)) {
      throw new NotFoundException(ERRORS.NO_ACTIVE_SUBSCRIPTION);
    }
  }

  async getTheme(slug: string) {
    try {
      const establishment = await this.getEstablishmentCore(slug);
      this.validateEstablishment(establishment);

      if (!establishment.activeTheme) {
        throw new NotFoundException(ERRORS.NOT_FOUND);
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
          favicon16x16: establishment.favicons.find((f) => f.role === 'favicon-16x16.png')?.image?.url || null,
          favicon32x32Png: establishment.favicons.find((f) => f.role === 'favicon-32x32.png')?.image?.url || null,
          appleTouchIconPng: establishment.favicons.find((f) => f.role === 'apple-touch-icon.png')?.image?.url || null,
          androidChrome192x192Png: establishment.favicons.find((f) => f.role === 'android-chrome-192x192.png')?.image?.url || null,
          androidChrome512x512Png: establishment.favicons.find((f) => f.role === 'android-chrome-512x512.png')?.image?.url || null,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar theme para ${slug}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(ERRORS.BAD_REQUEST);
    }
  }

  async getEstablishmentSettings(slug: string) {
    try {
      const establishment = await this.getEstablishmentCore(slug);
      this.validateEstablishment(establishment);

      return {
        id: establishment.id,
        name: establishment.name,
        primaryLanguage: establishment.primaryLanguage,
        availableLocales: establishment.availableLanguages,
        currency: establishment.currency,
        timezone: establishment.timezone,
        address: establishment.address,
        city: establishment.city,
        zipCode: establishment.zipCode,
        state: establishment.state,
        phone: establishment.phoneNumber,
        schedule: normalizeSchedule(establishment.schedule ?? undefined),
        socials: {
          tiktokUrl: establishment.tiktokUrl,
          instagramUrl: establishment.instagramUrl,
          facebookUrl: establishment.facebookUrl,
          tripAdvisorUrl: establishment.tripAdvisorUrl,
          googleReviewUrl: establishment.googleReviewUrl,
          websiteUrl: establishment.websiteUrl,
        },
        wifi: {
          ssid: establishment.wifiSsid,
          password: establishment.wifiPassword,
        },
        analytics: {
          googleAnalyticsId: establishment.googleAnalyticsId,
        },
        modules: {
          menus: establishment.menusModule,
          takeaway: establishment.takeAwayModule,
          reservations: establishment.reservationsModule,
          callStaff: establishment.callStaffModule,
        }
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar settings para ${slug}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(ERRORS.BAD_REQUEST);
    }
  }

  async getMenuList(slug: string, lang: string, qrSession?: QrSessionTokenPayload | null) {
    try {
      const establishment = await this.getEstablishmentCore(slug);
      this.validateEstablishment(establishment);

      if (!establishment.menusModule) {
        this.logger.debug(`Establishment ${establishment.id} has no menusModule`);
        throw new NotFoundException(ERRORS.NOT_FOUND);
      }

      // Normalizar a língua
      let currentLang = lang;
      if (!Object.values(establishment.availableLanguages).includes(lang as EstablishmentLanguage)) {
        currentLang = establishment.primaryLanguage;
      }

      const isAtEstablishment = !!(qrSession && qrSession.eid === establishment.id);
      const targetId = isAtEstablishment ? qrSession.spid : undefined;

      const menuCacheKey = menuListCacheKey(slug, currentLang, targetId);

      return await this.cache.wrap(menuCacheKey, 3600, async () => {
        if (isAtEstablishment) {
          if (!establishment.schedule || !isScheduleOpenNow(establishment.schedule, establishment.timezone)) {
            throw new BadRequestException(ERRORS.ESTABLISHMENT_CLOSED);
          }
        }

        const menus = await this.prisma.menu.findMany({
          where: {
            establishmentId: establishment.id,
            isVisible: true,
          },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            isHighlighted: true,
            isVisible: true,
            position: true,
            type: true,
            schedule: { include: { days: { include: { intervals: true } } } },
            translations: { where: { locale: currentLang } },
          },
        });

        const visibleAndOpenMenus = isAtEstablishment
          ? menus.filter((menu) => {
            if (!menu.schedule) return false;
            return isScheduleOpenNow(menu.schedule, establishment.timezone);
          })
          : menus;

        return { menus: visibleAndOpenMenus || [] };
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar menu list para ${slug} (${lang}):`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(ERRORS.BAD_REQUEST);
    }
  }

  async getMenuContent(slug: string, menuId: string, lang: EstablishmentLanguage, qrSession?: QrSessionTokenPayload | null) {
    try {
      const establishment = await this.getEstablishmentCore(slug);
      this.validateEstablishment(establishment);

      if (!establishment.menusModule) {
        this.logger.debug(`Establishment ${establishment.id} has no menusModule`);
        throw new NotFoundException(ERRORS.NOT_FOUND);
      }

      // Normalizar a língua
      let currentLang = lang;
      if (!Object.values(establishment.availableLanguages).includes(lang as any)) {
        currentLang = establishment.primaryLanguage;
      }

      const isAtEstablishment = !!(qrSession && qrSession.eid === establishment.id);
      const cacheKey = menuItemsCacheKey(slug, currentLang, menuId);

      const menu = await this.cache.wrap(cacheKey, 3600, async () => {
        const menuData = await this.prisma.menu.findFirst({
          where: { id: menuId, establishmentId: establishment.id },
          select: {
            id: true,
            type: true,
            showImages: true,
            color: true,
            isHighlighted: true,
            schedule: { include: { days: { include: { intervals: true } } } },
            translations: {
              where: { locale: currentLang as any },
              select: {
                name: true,
                description: true,
                observations: true,
              },
            },
            categories: {
              orderBy: { position: 'asc' },
              where: { isVisible: true },
              select: {
                id: true,
                image: { select: { url: true } },
                translations: {
                  where: { locale: currentLang as any },
                  select: { name: true },
                },
                subcategories: {
                  orderBy: { position: 'asc' },
                  where: { isVisible: true },
                  select: {
                    id: true,
                    translations: {
                      where: { locale: currentLang as any },
                      select: { name: true, description: true },
                    },
                    items: {
                      orderBy: { position: 'asc' },
                      where: {
                        isVisible: true,
                        item: { status: 'ACTIVE' },
                      },
                      select: {
                        id: true,
                        position: true,
                        isIncluded: true,
                        item: {
                          select: {
                            id: true,
                            basePrice: true,
                            spiceLevel: true,
                            marketingTag: true,
                            isFeatured: true,
                            hasAlcohol: true,
                            unit: true,
                            quantity: true,
                            image: { select: { url: true } },
                            translations: {
                              where: { locale: currentLang as any },
                              select: { name: true, shortDescription: true, description: true },
                            },
                            attributes: { select: { type: true } },
                            allergens: {
                              select: { allergen: { select: { code: true } } },
                            },
                            nutritionInfo: true,
                            itemVariantGroups: {
                              orderBy: { position: 'asc' },
                              select: {
                                id: true,
                                translations: {
                                  where: { locale: currentLang as any },
                                  select: { name: true },
                                },
                                variants: {
                                  orderBy: { position: 'asc' },
                                  where: { isActive: true, deletedAt: null },
                                  select: {
                                    id: true,
                                    price: true,
                                    isDefault: true,
                                    image: { select: { url: true } },
                                    nutritionInfo: true,
                                    variantOption: {
                                      select: {
                                        id: true,
                                        translations: {
                                          where: { locale: currentLang as any },
                                          select: { name: true },
                                        },
                                      },
                                    },
                                    allergens: {
                                      select: { allergen: { select: { code: true } } },
                                    },
                                  },
                                },
                              },
                            },
                            modifierGroups: {
                              orderBy: { position: 'asc' },
                              where: { isActive: true, deletedAt: null },
                              select: {
                                id: true,
                                minSelection: true,
                                maxSelection: true,
                                displayMode: true,
                                translations: {
                                  where: { locale: currentLang as any },
                                  select: { name: true },
                                },
                                options: {
                                  orderBy: { position: 'asc' },
                                  select: {
                                    id: true,
                                    price: true,
                                    defaultQuantity: true,
                                    minQuantity: true,
                                    maxQuantity: true,
                                    addon: {
                                      select: {
                                        id: true,
                                        translations: {
                                          where: { locale: currentLang as any },
                                          select: { name: true },
                                        },
                                      },
                                    },
                                    itemVariant: {
                                      select: {
                                        id: true,
                                        price: true,
                                        variantOption: {
                                          select: {
                                            translations: {
                                              where: { locale: currentLang as any },
                                              select: { name: true },
                                            },
                                          },
                                        },
                                      },
                                    },
                                    product: {
                                      select: {
                                        id: true,
                                        basePrice: true,
                                        image: { select: { url: true } },
                                        translations: {
                                          where: { locale: currentLang as any },
                                          select: { name: true },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!menuData) {
          throw new NotFoundException(ERRORS.MENU_NOT_FOUND);
        }

        return menuData;
      });

      if (isAtEstablishment) {
        if (!establishment.schedule || !isScheduleOpenNow(establishment.schedule, establishment.timezone)) {
          throw new BadRequestException(ERRORS.ESTABLISHMENT_CLOSED);
        }
        if (!menu.schedule || !isScheduleOpenNow(menu.schedule, establishment.timezone)) {
          throw new BadRequestException(ERRORS.MENU_CLOSED);
        }
      }

      const { schedule, ...responseMenu } = menu;
      return responseMenu;
    } catch (error) {
      this.logger.error(`Erro ao buscar menu content para ${menuId} em ${slug}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(ERRORS.BAD_REQUEST);
    }
  }
}
