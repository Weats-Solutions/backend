import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { User, Establishment } from '@weats/types';
import { RESPONSE_CODES, ERRORS, FeatureUsageService, normalizeSchedule, DEFAULT_SCHEDULE_NAMES, RESERVED_DOMAINS } from '@weats/common';
import { CreateEstablishmentDto, UpdateEstablishmentLanguagesDto } from '@weats/contracts/dashboard/dtos/establishment';
import { CorePrismaService, EstablishmentLanguage, ScheduleType } from '@weats/database';
import { EstablishmentStatus } from '@weats/database';
import { ulid } from 'ulid';
import { ClerkService, StripeService } from '@weats/integrations';
import { CreateScheduleDto } from '@weats/contracts/dashboard/dtos/schedule';
import { EstablishmentBrandingDto, EstablishmentDomainDto, EstablishmentInformationsDto, EstablishmentLanguageDto, EstablishmentLocationDto, EstablishmentPreferencesDto, EstablishmentSocialMediaDto, UpdateEstablishmentBrandingSettingsDto, UpdateEstablishmentDigitalSettingsDto, UpdateEstablishmentGeneralSettingsDto, UpdateEstablishmentSystemSettingsDto } from '@weats/contracts';
import { MenuUtilsService } from '@weats/common/utils/modules/menu/menu-utils.service';

export type NormalizedFeature =
  | { type: "BOOLEAN"; enabled: boolean }
  | { type: "QUANTITY"; limit: number };

export interface NormalizedPlan {
  id: string;
  name: string;
  features: Record<string, NormalizedFeature>;
}


@Injectable()
export class EstablishmentService {
  private readonly logger = new Logger(EstablishmentService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    private readonly stripe: StripeService,
    @InjectQueue('emails') private readonly emailQueue: Queue,
    @Inject('APP_URL') private readonly appUrl: string,
    private readonly clerkService: ClerkService,
    private readonly featureUsageService: FeatureUsageService,
    private readonly menuUtilsService: MenuUtilsService,
  ) { }

  // ─── Queries ────────────────────────────────────────────────────────

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
        status: 404,
        message: ERRORS.ESTABLISHMENT_NOT_FOUND,
        code: ERRORS.ESTABLISHMENT_NOT_FOUND,
      });
    }

    const plan = await this.getPlan(id);
    const subscription = await this.getSubscription(id);

    console.log("PLAN", plan)
    console.log("SUBSCRIPTION", subscription)

    console.log("LOGO IMAGE", establishment.logoImage?.id)
    console.log("BANNER IMAGE", establishment.bannerImage?.id)

    return { ...establishment, subscription, plan };
  }

  /**
   * Full establishment info including all relations.
   * Used internally (e.g. for update operations).
   */
  private async getFullEstablishmentInfo(id: string) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { id },
      include: {
        logoImage: { select: { id: true, url: true } },
        bannerImage: { select: { id: true, url: true } },
        subscription: true,
      },
    });

    if (!establishment) {
      throw new RpcException({
        status: 404,
        message: ERRORS.ESTABLISHMENT_NOT_FOUND,
        code: ERRORS.ESTABLISHMENT_NOT_FOUND,
      });
    }

    return establishment;
  }

  async getEstablishmentGeneralSettings(id: string) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        phoneNumber: true,
        countryCode: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        schedule: {
          include: { days: { include: { intervals: true } } }
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

    let schedule;

    if (establishment.schedule) {
      schedule = normalizeSchedule(establishment.schedule);
    } else {
      schedule = null;
    }

    return {
      informations: {
        name: establishment.name,
        email: establishment.email,
        phoneNumber: establishment.phoneNumber,
        countryCode: establishment.countryCode,
      },
      location: {
        address: establishment.address,
        city: establishment.city,
        state: establishment.state,
        zipCode: establishment.zipCode,
        country: establishment.country,
      },
      schedule,
    };
  }

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

    };
  }

  async getEstablishmentSystemSettings(establishment: Establishment) {
    return {
      preferences: {
        currency: establishment.currency,
        timezone: establishment.timezone,
      },
      languages: {
        primaryLanguage: establishment.primaryLanguage,
        availableLanguages: establishment.availableLanguages,
      }
    };
  }

  async getEstablishmentSchedule(id: string) {
    const establishment = await this.prisma.establishment.findUniqueOrThrow({
      where: { id },
      include: {
        schedule: {
          include: { days: { include: { intervals: true } } }
        },
      }
    });

    if (!establishment.schedule) {
      return null;
    }

    return normalizeSchedule(establishment.schedule);
  }


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

      if (f.feature.type === "BOOLEAN") {
        features[featureName] = { type: "BOOLEAN", enabled: f.valueBoolean ?? false };
      } else if (f.feature.type === "QUANTITY") {
        features[featureName] = { type: "QUANTITY", limit: f.valueQuantity ?? 0 };
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

  // ─── Mutations ──────────────────────────────────────────────────────

  async createEstablishment(
    createEstablishmentDto: CreateEstablishmentDto,
    user: User,
  ) {
    console.log(createEstablishmentDto.countryCode)
    const cleanPhone =
      createEstablishmentDto.phoneNumber.replace(/\D/g, '');
    const cleanTaxId =
      createEstablishmentDto.billingTaxId
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

    const customer = await this.stripe.createCustomer({
      name: createEstablishmentDto.name,
      email: createEstablishmentDto.email,
      phone: createEstablishmentDto.countryCode + cleanPhone,
      address: {
        line1: createEstablishmentDto.address,
        city: createEstablishmentDto.city,
        state: createEstablishmentDto.state,
        postal_code: createEstablishmentDto.zipCode,
        country: createEstablishmentDto.country,
      },

      //todo add tax_country
      tax_id_data: cleanTaxId
        ? [{ type: 'eu_vat', value: "PT" + cleanTaxId }]
        : [],
      metadata: {
        business_name: createEstablishmentDto.billingName,
        owner_id: user.id,
      },
    });

    const slug = await this.generateUniqueSlug(createEstablishmentDto.name);

    const createdEstablishment = await this.prisma.establishment.create({
      data: {
        name: createEstablishmentDto.name,
        type: createEstablishmentDto.type,
        slug,
        ownerId: user.id,
        stripeCustomerId: customer.id,
        email: createEstablishmentDto.email,
        address: createEstablishmentDto.address,
        city: createEstablishmentDto.city,
        state: createEstablishmentDto.state,
        zipCode: createEstablishmentDto.zipCode,
        country: createEstablishmentDto.country,
        countryCode:
          createEstablishmentDto.countryCode,
        phoneNumber:
          createEstablishmentDto.phoneNumber,
        billingName:
          createEstablishmentDto.billingName,
        billingTaxId:
          createEstablishmentDto.billingTaxId,
        primaryLanguage:
          createEstablishmentDto.primaryLanguage,
        availableLanguages: [
          createEstablishmentDto.primaryLanguage,
        ],
        currency: createEstablishmentDto.currency,
        timezone: createEstablishmentDto.timezone,
      },
    });

    // Update Clerk Metadata
    try {
      const clerkUser = await this.clerkService.getUser(user.clerkUserId);
      const currentMetadata = clerkUser.publicMetadata;
      const establishments = currentMetadata.establishments || {};

      establishments[createdEstablishment.id] = {
        status: 'INACTIVE',
        role: 'OWNER',
      };

      await this.clerkService.updateUserMetadata(user.clerkUserId, {
        establishments,
      });
    } catch (error) {
      this.logger.error('Error updating Clerk metadata:', error);
    }

    return {
      message: RESPONSE_CODES.ESTABLISHMENT.CREATED,
      establishmentId: createdEstablishment.id,
    };
  }

  async updateEstablishment(
    id: string,
    updateEstablishmentDto: CreateEstablishmentDto,
    user: User,
  ) {
    const establishment = await this.getFullEstablishmentInfo(id);

    if (!establishment) {
      throw new RpcException({
        status: 400,
        message: ERRORS.ESTABLISHMENT_DETAILS_NOT_FOUND,
        code: ERRORS.ESTABLISHMENT_DETAILS_NOT_FOUND,
      });
    }

    const slug = await this.generateUniqueSlug(updateEstablishmentDto.name);

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedEstablishment = await prisma.establishment.update({
        where: { id, ownerId: user.id },
        data: {
          name: updateEstablishmentDto.name,
          type: updateEstablishmentDto.type,
          slug,
        },
      });

      const updatedDetails = await prisma.establishment.update({
        where: { id: establishment.id },
        data: {
          address: updateEstablishmentDto.address,
          city: updateEstablishmentDto.city,
          state: updateEstablishmentDto.state,
          zipCode: updateEstablishmentDto.zipCode,
          country: updateEstablishmentDto.country,
          countryCode: updateEstablishmentDto.countryCode,
          phoneNumber: updateEstablishmentDto.phoneNumber,
        },
      });

      return {
        message: RESPONSE_CODES.ESTABLISHMENT.UPDATED,
        updatedEstablishment,
        updatedDetails,
      };
    });

    return result;
  }

  async updateEstablishmentGeneralSettings(
    establishment: Establishment,
    dto: UpdateEstablishmentGeneralSettingsDto
  ) {
    try {
      let result;

      switch (dto.section) {
        case 'informations':
          result = await this.updateInformations(establishment.id, dto.informations);
          break;

        case 'location':
          result = await this.updateLocation(establishment.id, dto.location);
          break;

        case 'schedule':
          result = await this.updateSchedule(establishment.id, dto.schedule);
          break;

        default:
          throw new RpcException({
            status: 400,
            message: 'Invalid general settings section',
            code: ERRORS.BAD_REQUEST,
          });
      }

      this.menuUtilsService.clearMenuCacheAsync('settings', establishment.slug);

      return result;

    } catch (error) {
      if (error instanceof RpcException) throw error;

      console.error(`[GeneralSettings] Update failed for section ${dto.section}:`, error);

      throw new RpcException({
        status: 400,
        message: ERRORS.BAD_REQUEST,
        code: ERRORS.BAD_REQUEST,
      });
    }
  }
  private async updateInformations(id: string, data: EstablishmentInformationsDto) {
    return this.prisma.establishment.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        countryCode: data.countryCode,
        phoneNumber: data.phoneNumber
      }
    })
  }

  private async updateLocation(id: string, data: EstablishmentLocationDto) {
    return this.prisma.establishment.update({
      where: { id },
      data: {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country
      }
    })
  }

  async updateEstablishmentBrandingSettings(
    establishment: Establishment,
    dto: UpdateEstablishmentBrandingSettingsDto
  ) {
    try {
      let result;

      // 1. Executa a atualização baseada na secção
      switch (dto.section) {
        case 'branding':
          result = await this.updateBranding(establishment.id, dto.branding);
          this.menuUtilsService.clearMenuCacheAsync('theme', establishment.slug);
          break;

        case 'socials':
          result = await this.updateSocials(establishment.id, dto.socials);
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

    } catch (error) {
      // Se já for uma RpcException, apenas a relança
      if (error instanceof RpcException) throw error;

      // Log do erro real para debug interno
      console.error(`[BrandingSettings] Update failed:`, error);

      // Erro genérico para o cliente
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
      }
    })
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
        websiteUrl: data.websiteUrl
      }
    })
  }

  async updateEstablishmentSystemSettings(establishment: Establishment, dto: UpdateEstablishmentSystemSettingsDto) {
    try {
      let result;

      switch (dto.section) {
        case 'preferences':
          result = await this.updatePreferences(establishment.id, dto.preferences);
          break;

        case 'languages':
          result = await this.updateLanguages(establishment, dto.languages);
          break;

        default:
          throw new RpcException({
            status: 400,
            message: 'Invalid section provided',
            code: ERRORS.BAD_REQUEST,
          });
      }

      this.menuUtilsService.clearMenuCacheAsync('settings', establishment.slug);

      return result;

    } catch (error) {
      // Se já for uma RpcException, apenas a relança
      if (error instanceof RpcException) throw error;

      // Log do erro real para debug interno
      console.error(`[SystemSettings] Update failed:`, error);

      // Erro genérico para o cliente
      throw new RpcException({
        status: 400,
        message: ERRORS.BAD_REQUEST,
        code: ERRORS.BAD_REQUEST,
      });
    }
  }

  private async updatePreferences(id: string, data: EstablishmentPreferencesDto) {
    return this.prisma.establishment.update({
      where: { id },
      data: {
        currency: data.currency,
        timezone: data.timezone,
      }
    })
  }

  private async updateLanguages(establishment: Establishment, data: EstablishmentLanguageDto) {
    const { limit } = await this.featureUsageService.getUsageAndLimit("languages", establishment.id)
    if (limit !== null && data.availableLanguages.length > limit) {
      throw new RpcException({
        status: 400,
        message: ERRORS.FEATURE_LIMIT_REACHED,
        code: ERRORS.FEATURE_LIMIT_REACHED,
      });
    }

    if (!data.availableLanguages.includes(establishment.primaryLanguage as EstablishmentLanguage)) {
      throw new RpcException({
        status: 400,
        message: ERRORS.BAD_REQUEST,
        code: ERRORS.BAD_REQUEST,
      });
    }

    return this.prisma.establishment.update({
      where: { id: establishment.id },
      data: {
        availableLanguages: data.availableLanguages,
      }
    })
  }

  private async updateSchedule(id: string, data: CreateScheduleDto) {
    const establishmentWithSchedule = await this.prisma.establishment.findUnique({
      where: { id },
      select: { scheduleId: true },
    });

    if (!establishmentWithSchedule) throw new RpcException({
      status: 400,
      message: ERRORS.ESTABLISHMENT_NOT_FOUND,
      code: ERRORS.ESTABLISHMENT_NOT_FOUND,
    });

    // Se tem schedule → atualizar, senão → criar
    if (establishmentWithSchedule.scheduleId) {
      return this.prisma.schedule.update({
        where: { id: establishmentWithSchedule.scheduleId },
        data: {
          days: {
            deleteMany: {},
            create: data.days.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              isOpen: day.isOpen ?? true,
              intervals: {
                create: day.intervals.map((interval) => ({
                  startTime: interval.startTime,
                  endTime: interval.endTime,
                })),
              },
            })),
          },
        },
      });
    } else {
      const newSchedule = await this.prisma.schedule.create({
        data: {
          type: ScheduleType.ESTABLISHMENT,
          days: {
            create: data.days.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              isOpen: day.isOpen ?? true,
              intervals: {
                create: day.intervals.map((interval) => ({
                  startTime: interval.startTime,
                  endTime: interval.endTime,
                })),
              },
            })),
          },
        },
      });

      await this.prisma.establishment.update({
        where: { id },
        data: { scheduleId: newSchedule.id },
      });

      return newSchedule;
    }
  }

  async upsertEstablishmentSchedule(establishment: Establishment, scheduleDto: CreateScheduleDto) {
    const establishmentWithSchedule = await this.prisma.establishment.findUnique({
      where: { id: establishment.id },
      select: { scheduleId: true },
    });

    if (!establishmentWithSchedule) throw new RpcException({
      status: 400,
      message: ERRORS.ESTABLISHMENT_NOT_FOUND,
      code: ERRORS.ESTABLISHMENT_NOT_FOUND,
    });

    // Se tem schedule → atualizar, senão → criar
    if (establishmentWithSchedule.scheduleId) {
      return this.prisma.schedule.update({
        where: { id: establishmentWithSchedule.scheduleId },
        data: {
          days: {
            deleteMany: {},
            create: scheduleDto.days.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              isOpen: day.isOpen ?? true,
              intervals: {
                create: day.intervals.map((interval) => ({
                  startTime: interval.startTime,
                  endTime: interval.endTime,
                })),
              },
            })),
          },
        },
      });
    } else {
      const newSchedule = await this.prisma.schedule.create({
        data: {
          type: ScheduleType.ESTABLISHMENT,
          days: {
            create: scheduleDto.days.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              isOpen: day.isOpen ?? true,
              intervals: {
                create: day.intervals.map((interval) => ({
                  startTime: interval.startTime,
                  endTime: interval.endTime,
                })),
              },
            })),
          },
        },
      });

      await this.prisma.establishment.update({
        where: { id: establishment.id },
        data: { scheduleId: newSchedule.id },
      });

      return newSchedule;
    }
  }

  async updateEstablishmentDigitalSettings(establishment: Establishment, updateEstablishmentDigitalSettingsDto: UpdateEstablishmentDigitalSettingsDto) {
    if (updateEstablishmentDigitalSettingsDto.section === 'domain') {
      return this.updateDomain(establishment, updateEstablishmentDigitalSettingsDto.domain);
    }
  }

  async updateDomain(establishment: Establishment, domainDto: EstablishmentDomainDto) {
    await this.verifyDomain(domainDto.slug);

    return this.prisma.establishment.update({
      where: { id: establishment.id },
      data: {
        slug: domainDto.slug,
      },
    });
  }

  async verifyDomain(slug: string) {
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

  /*
  async updateLanguages(establishment: Establishment, updateEstablishmentLanguagesDto: UpdateEstablishmentLanguagesDto) {
    const { limit } = await this.featureUsageService.getUsageAndLimit("languages", establishment.id)
    if (limit !== null && updateEstablishmentLanguagesDto.availableLanguages.length > limit) {
      throw new RpcException({
        status: 400,
        message: ERRORS.FEATURE_LIMIT_REACHED,
        code: ERRORS.FEATURE_LIMIT_REACHED,
      });
    }

    if (!updateEstablishmentLanguagesDto.availableLanguages.includes(establishment.primaryLanguage as EstablishmentLanguage)) {
      throw new RpcException({
        status: 400,
        message: ERRORS.BAD_REQUEST,
        code: ERRORS.BAD_REQUEST,
      });
    }

    const updatedEstablishment = await this.prisma.establishment.update({
      where: { id: establishment.id },
      data: {
        availableLanguages: updateEstablishmentLanguagesDto.availableLanguages,
      },
    });

    return {
      message: RESPONSE_CODES.ESTABLISHMENT.UPDATED,
      updatedEstablishment,
    };
  }
    */

  /*
    async updateBranding(establishmentId: string, updateEstablishmentBrandingDto: UpdateEstablishmentBrandingDto) {
  
      const updatedEstablishment = await this.prisma.establishment.update({
        where: { id: establishmentId },
        data: {
          logoImageId: updateEstablishmentBrandingDto.logoImage?.id ?? null,
          bannerImageId: updateEstablishmentBrandingDto.bannerImage?.id ?? null,
        },
        select: {
          logoImage: {
            select: {
              id: true,
              url: true,
            },
          },
          bannerImage: {
            select: {
              id: true,
              url: true,
            },
          },
        },
      });
  
      console.log("LOGO IMAGE", updateEstablishmentBrandingDto.logoImage?.id)
      console.log("BANNER IMAGE", updateEstablishmentBrandingDto.bannerImage?.id)
  
      return {
        message: RESPONSE_CODES.ESTABLISHMENT.UPDATED,
  
      };
    }
      */

  // ─── Stripe / Subscriptions ─────────────────────────────────────────

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

    const checkoutSession = await this.stripe.createCheckoutSession({
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

    const portalUrl = await this.stripe.getPortalSession({
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

    const stripeSubscription = await this.stripe.getSubscriptionById(
      subscription.stripeSubscriptionId,
    );

    if (!stripeSubscription) {
      throw new RpcException({
        status: 404,
        message: ERRORS.STRIPE_SUBSCRIPTION_NOT_FOUND,
        code: ERRORS.STRIPE_SUBSCRIPTION_NOT_FOUND,
      });
    }

    await this.stripe.cancelSubscription(subscription.stripeSubscriptionId);

    return { success: true };
  }

  // ─── Sync ────────────────────────────────────────────────────────────

  async syncSubscriptionStatus() {
    const users = await this.prisma.user.findMany({
      include: { establishments: true },
    });

    let processedCount = 0;

    for (const user of users) {
      const establishmentsMetadata: Record<string, { status: string; role: string }> = {};
      let hasUpdates = false;

      for (const establishment of user.establishments) {
        if (!establishment.stripeCustomerId) continue;

        const statusString = await this.stripe.getSubscriptionStatus(
          establishment.stripeCustomerId,
        );

        let dbStatus: EstablishmentStatus = EstablishmentStatus.INACTIVE;
        if (statusString === 'ACTIVE' || statusString === 'TRIALING') {
          dbStatus = EstablishmentStatus.ACTIVE;
        }

        establishmentsMetadata[establishment.id] = {
          status: statusString,
          role: 'OWNER',
        };
        hasUpdates = true;

        if (establishment.status !== dbStatus) {
          await this.prisma.establishment.update({
            where: { id: establishment.id },
            data: { status: dbStatus },
          });
        }
      }

      if (hasUpdates) {
        await this.clerkService.updateUserMetadata(user.clerkUserId, {
          establishments: establishmentsMetadata,
        });
        processedCount++;
      }
    }

    return { success: true, processedCount };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private generateSlug(name: string): string {
    return name
      .normalize('NFD')                 // Decompõe caracteres acentuados (ex: á -> a + ´)
      .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')    // Remove caracteres especiais que sobraram
      .replace(/\s+/g, '-')            // Espaços para hífens
      .replace(/-+/g, '-')             // Remove hífens duplicados
      .replace(/^-+|-+$/g, '');        // Remove hífens no início e fim
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let baseSlug = this.generateSlug(name);

    // Tratamento de domínios reservados logo no início
    if (RESERVED_DOMAINS.includes(baseSlug)) {
      baseSlug = `${baseSlug}-${ulid().slice(-4)}`;
    }

    let currentSlug = baseSlug;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const exists = await this.prisma.establishment.findUnique({
        where: { slug: currentSlug },
        select: { id: true } // Seleciona apenas o ID para ser mais rápido
      });

      if (!exists) {
        isUnique = true;
      } else {
        // Gera um novo sufixo a cada tentativa falhada
        currentSlug = `${baseSlug}-${ulid().slice(-4)}`;
        attempts++;
      }
    }

    return currentSlug;
  }
}
