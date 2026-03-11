import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '@weats/configs/app-config.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { User } from '@weats/types';
import { Establishment } from '@weats/types';
import { RESPONSE_CODES, ERRORS } from '@weats/common';
import { EstablishmentLanguage } from '@weats/database/core-prisma.service';
import { CreateEstablishmentDto } from '@weats/contracts/dashboard/dtos/establishment';
import { CorePrismaService } from '@weats/database';
import { ulid } from 'ulid';
import { ClerkService, StripeService } from '@weats/integrations';

@Injectable()
export class EstablishmentService {
  constructor(
    private readonly prisma: CorePrismaService,
    private readonly stripe: StripeService,
    private readonly appConfig: AppConfigService,
    @InjectQueue('emails') private readonly emailQueue: Queue,
    @Inject('APP_URL') private readonly appUrl: string,
    private readonly clerkService: ClerkService,
  ) {}

  async addLanguage(id: string, languages: EstablishmentLanguage[]) {
    try {
      const establishment = await this.prisma.establishment.findUnique({
        where: { id },
      });
      if (!establishment) {
        throw new BadRequestException({
          message: 'Establishment not found',
          code: ERRORS.ESTABLISHMENT_NOT_FOUND,
        });
      }
      await this.prisma.establishment.update({
        where: { id },
        data: {
          establishmentSettings: {
            update: {
              availableLanguages: {
                push: languages,
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error adding language: ' + error.message);
      throw new BadRequestException({
        message: 'Error adding language',
        code: ERRORS.BAD_REQUEST,
      });
    }
  }

  async findById(id: string) {
    try {
      const establishment = await this.prisma.establishment.findUnique({
        where: { id },
        include: {
          establishmentSettings: true,
          owner: true,
          subscription: {
            select: {
              status: true,
            },
          },
        },
      });
      if (
        !establishment ||
        !establishment.establishmentSettings?.primaryLanguage ||
        !establishment.establishmentSettings?.availableLanguages
      ) {
        throw new BadRequestException({
          message: 'Establishment not found',
          code: ERRORS.ESTABLISHMENT_NOT_FOUND,
        });
      }
      if (
        !establishment.establishmentSettings?.primaryLanguage ||
        !establishment.establishmentSettings?.availableLanguages
      ) {
        throw new BadRequestException({
          message: 'Establishment settings not completed',
          code: ERRORS.ESTABLISHMENT_NOT_FOUND,
        });
      }

      return {
        id: establishment.id,
        ownerId: establishment.ownerId,
        stripeCustomerId: establishment.stripeCustomerId,
        primaryLanguage: establishment.establishmentSettings.primaryLanguage,
        availableLanguages:
          establishment.establishmentSettings.availableLanguages,
      };
    } catch (error) {
      console.error('Error fetching establishment: ' + error.message);
      throw new BadRequestException({
        message: 'Error fetching establishment',
        code: ERRORS.BAD_REQUEST,
      });
    }
  }

  async getEstablishmentInfoById(id: string) {
    try {
      /*
      const cacheKey = cacheKeys.establishment(id);

      // Try to get from cache
      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
        */

      const establishment = await this.prisma.establishment.findUnique({
        where: { id },
        include: {
          subscription: true,
          establishmentDetails: true,
          establishmentSettings: {
            select: {
              id: true,
              primaryLanguage: true,
              availableLanguages: true,
              onlyMenu: true,
              needSession: true,
            },
          },
          establishmentSocialMedia: {
            select: {
              id: true,
              instagramUrl: true,
              tiktokUrl: true,
              facebookUrl: true,
              googleReviewUrl: true,
              tripAdvisorUrl: true,
            },
          },
          establishmentBrand: {
            include: {
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
          },
        },
      });
      if (!establishment) {
        throw new BadRequestException({
          message: 'Establishment not found',
          code: ERRORS.ESTABLISHMENT_NOT_FOUND,
        });
      }

      //await this.cacheManager.set(cacheKey, establishment, cacheTTL.FIVE_MINUTES);

      return establishment;
    } catch (error) {
      console.error('Error fetching establishment: ' + error.message);
      throw new BadRequestException({
        message: 'Error fetching establishment',
        code: ERRORS.BAD_REQUEST,
      });
    }
  }

  async getEstablishmentInfo(id: string) {
    try {
      /*
      const cacheKey = cacheKeys.establishment(id);

      // Try to get from cache
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }
        */

      const establishment = await this.prisma.establishment.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          type: true,
          isOnline: true,
          subscription: {
            select: {
              status: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
            },
          },
          establishmentDetails: {
            select: {
              address: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              countryCode: true,
              phoneNumber: true,
              cuisine: true,
            },
          },
          establishmentSettings: {
            select: {
              primaryLanguage: true,
              availableLanguages: true,
              onlyMenu: true,
              needSession: true,
            },
          },
          establishmentSocialMedia: {
            select: {
              instagramUrl: true,
              tiktokUrl: true,
              facebookUrl: true,
              googleReviewUrl: true,
              tripAdvisorUrl: true,
            },
          },
          establishmentBrand: {
            select: {
              logoImage: {
                select: {
                  id: true,
                  url: true,
                },
              },
            },
          },
        },
      });

      if (!establishment) {
        throw new BadRequestException('Establishment not found');
      }

      //await this.cacheManager.set(cacheKey, establishment, cacheTTL.FIVE_MINUTES);

      return establishment;
    } catch (error) {
      throw new BadRequestException(
        'Error fetching establishment: ' + error.message,
      );
    }
  }

  async createEstablishment(
    createEstablishmentDto: CreateEstablishmentDto,
    user: User,
  ) {
    try {
      const countryCode = (
        createEstablishmentDto.establishmentDetails.countryCode || 'PT'
      ).toUpperCase();
      const phonePrefixes = { PT: '+351', ES: '+34' };
      const phonePrefix = phonePrefixes[countryCode] || '+351';

      // Clean phone and tax ID from spaces/non-digits
      const cleanPhone =
        createEstablishmentDto.establishmentDetails.phoneNumber.replace(
          /\D/g,
          '',
        );
      const cleanTaxId =
        createEstablishmentDto.establishmentDetails.billingTaxId
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');

      const customer = await this.stripe.createCustomer({
        name: createEstablishmentDto.name,
        email: createEstablishmentDto.email,
        phone: phonePrefix + cleanPhone,
        address: {
          line1: createEstablishmentDto.establishmentDetails.address,
          city: createEstablishmentDto.establishmentDetails.city,
          state: createEstablishmentDto.establishmentDetails.state,
          postal_code: createEstablishmentDto.establishmentDetails.zipCode,
          country: countryCode,
        },
        tax_id_data: cleanTaxId
          ? [
              {
                type: 'eu_vat',
                value: countryCode + cleanTaxId,
              },
            ]
          : [],
        metadata: {
          business_name:
            createEstablishmentDto.establishmentDetails.billingName,
          owner_id: user.id,
        },
      });

      let slug = this.generateSlug(createEstablishmentDto.name);
      let exists = await this.prisma.establishment.findUnique({
        where: { slug },
      });

      while (exists) {
        slug =
          this.generateSlug(createEstablishmentDto.name) +
          '-' +
          ulid().slice(-4);
        exists = await this.prisma.establishment.findUnique({
          where: { slug },
        });
      }

      const payload = {
        name: createEstablishmentDto.name,
        type: createEstablishmentDto.type,
        slug,
        ownerId: user.id,
        stripeCustomerId: customer.id,
        establishmentDetails: {
          create: {
            email: createEstablishmentDto.email,
            address: createEstablishmentDto.establishmentDetails.address,
            city: createEstablishmentDto.establishmentDetails.city,
            state: createEstablishmentDto.establishmentDetails.state,
            zipCode: createEstablishmentDto.establishmentDetails.zipCode,
            country: createEstablishmentDto.establishmentDetails.country,
            countryCode:
              createEstablishmentDto.establishmentDetails.countryCode || '',
            phoneNumber:
              createEstablishmentDto.establishmentDetails.phoneNumber,
            billingName:
              createEstablishmentDto.establishmentDetails.billingName,
            billingTaxId:
              createEstablishmentDto.establishmentDetails.billingTaxId,
          },
        },

        establishmentSettings: {
          create: {
            primaryLanguage:
              createEstablishmentDto.establishmentSettings.primaryLanguage,
            availableLanguages: [
              createEstablishmentDto.establishmentSettings.primaryLanguage,
            ],
          },
        },
      };

      const createEstablishment = await this.prisma.establishment.create({
        data: payload,
      });

      // Update Clerk Metadata
      try {
        const clerkUser = await this.clerkService.getUser(user.clerkUserId);
        const currentMetadata = clerkUser.publicMetadata;
        const establishments = currentMetadata.establishments || {};

        establishments[createEstablishment.id] = {
          status: 'INACTIVE',
          role: 'OWNER',
        };

        await this.clerkService.updateUserMetadata(user.clerkUserId, {
          establishments,
        });
      } catch (error) {
        console.error('Error updating Clerk metadata:', error);
      }

      //await this.cacheManager.del(cacheKeys.userEstablishmentIds(user.id));

      return {
        message: RESPONSE_CODES.ESTABLISHMENT.CREATED,
        establishmentId: createEstablishment.id,
      };
    } catch (error) {
      console.error('Error creating establishment:', error);
      throw new BadRequestException(RESPONSE_CODES.ESTABLISHMENT.ERROR);
    }
  }

  async subscribeToPlan(planCycleId: string, establishment: Establishment) {
    try {
      const plan = await this.prisma.planCycle.findUnique({
        where: {
          id: planCycleId,
        },
        select: {
          priceId: true,
        },
      });

      if (!plan) {
        throw new BadRequestException(RESPONSE_CODES.PLAN.INVALID_PLAN);
      }

      const checkoutSession = await this.stripe.createCheckoutSession({
        customerId: establishment.stripeCustomerId,
        priceId: plan.priceId,
        successUrl: `${this.appUrl}/establishment/${establishment.id}`,
        cancelUrl: `${this.appUrl}/establishment/${establishment.id}/subscription`,
        metadata: {
          establishmentId: establishment.id,
        },
      });

      return {
        checkoutUrl: checkoutSession,
      };
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      throw new BadRequestException(RESPONSE_CODES.GENERIC.ERROR);
    }
  }

  async getPortalSession(establishment: Establishment) {
    try {
      const portalUrl = await this.stripe.getPortalSession({
        customerId: establishment.stripeCustomerId,
        returnUrl: `${this.appUrl}/establishment/${establishment.id}/subscription`,
      });

      return {
        url: portalUrl,
      };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw new BadRequestException(RESPONSE_CODES.GENERIC.ERROR);
    }
  }

  async updateEstablishment(
    id: string,
    updateEstablishmentDto: CreateEstablishmentDto,
    user: User,
  ) {
    const establishment = await this.getEstablishmentInfoById(id);

    let slug = this.generateSlug(updateEstablishmentDto.name);
    let exists = await this.prisma.establishment.findUnique({
      where: { slug },
    });

    while (exists) {
      slug =
        this.generateSlug(updateEstablishmentDto.name) + '-' + ulid().slice(-4);
      exists = await this.prisma.establishment.findUnique({ where: { slug } });
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedEstablishment = await prisma.establishment.update({
        where: {
          id,
          ownerId: user.id,
        },
        data: {
          name: updateEstablishmentDto.name,
          type: updateEstablishmentDto.type,
          slug,
        },
      });

      if (!establishment.establishmentDetails) {
        console.error('Establishment details not found creating new details');
        throw new BadRequestException(RESPONSE_CODES.GENERIC.ERROR);
      }

      const updatedDetails = await prisma.establishmentDetails.update({
        where: {
          id: establishment.establishmentDetails.id,
        },
        data: {
          address: updateEstablishmentDto.establishmentDetails.address,
          city: updateEstablishmentDto.establishmentDetails.city,
          state: updateEstablishmentDto.establishmentDetails.state,
          zipCode: updateEstablishmentDto.establishmentDetails.zipCode,
          country: updateEstablishmentDto.establishmentDetails.country,
          countryCode: updateEstablishmentDto.establishmentDetails.countryCode,
          phoneNumber: updateEstablishmentDto.establishmentDetails.phoneNumber,
        },
      });

      return {
        message: RESPONSE_CODES.ESTABLISHMENT.UPDATED,
        updatedEstablishment,
        updatedDetails,
      };
    });

    if (!result) {
      throw new BadRequestException(RESPONSE_CODES.GENERIC.ERROR);
    }

    // Invalidate single establishment cache
    //await this.cacheManager.del(cacheKeys.establishment(id));

    return result;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-+|-+$/g, ''); // Trim dashes from start/end
  }

  async syncSubscriptionStatus() {
    const users = await this.prisma.user.findMany({
      include: { establishments: true },
    });

    let processedCount = 0;

    for (const user of users) {
      const establishmentsMetadata: Record<
        string,
        { status: string; role: string }
      > = {};
      let hasUpdates = false;

      for (const establishment of user.establishments) {
        if (!establishment.stripeCustomerId) continue;

        const statusString =
          await this.stripeSubscriptionService.getSubscriptionStatus(
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

    this.logger.log(`Sync complete. Processed ${processedCount} users.`);
    return { success: true, processedCount };
  }

  async cancelSubscription(establishmentId: string, user: User) {
    /* Find the establishment in the database */
    const establishment = await this.prisma.establishment.findUnique({
      where: {
        id: establishmentId,
        ownerId: user.id,
      },
    });

    /* If the establishment does not exist, throw an error */
    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }

    /* Verify if the establishment has a subscription */
    const subscriptions = await this.prisma.subscription.findUnique({
      where: {
        establishmentId: establishment.id,
      },
    });

    /* If no subscriptions are found, throw an error */
    if (!subscriptions) {
      throw new NotFoundException(
        'No active subscription found for this establishment',
      );
    }

    /* Verify subscription status with Stripe */
    const stripeSubscription =
      await this.stripeSubscriptionService.getSubscriptionById(
        subscriptions.stripeSubscriptionId,
      );

    /* If the subscription does not exist in Stripe, throw an error */
    if (!stripeSubscription) {
      throw new NotFoundException('Subscription not found in Stripe');
    }

    /* Cancel the subscription with Stripe */
    await this.stripeSubscriptionService.cancelSubscription(
      subscriptions.stripeSubscriptionId,
    );

    return { success: true };
  }

  async getSubscription(establishmentId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        establishmentId,
      },
      include: {
        planCycle: {
          include: {
            plan: {
              include: {
                features: {
                  include: {
                    feature: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return subscription;
  }
}
