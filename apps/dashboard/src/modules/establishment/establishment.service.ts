import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AppConfigService } from '@weats/configs/app-config.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { User, Establishment } from '@weats/types';
import { RESPONSE_CODES, ERRORS } from '@weats/common';
import { CreateEstablishmentDto } from '@weats/contracts/dashboard/dtos/establishment';
import { CorePrismaService } from '@weats/database';
import { EstablishmentStatus } from '@weats/database';
import { ulid } from 'ulid';
import { ClerkService, StripeService } from '@weats/integrations';

@Injectable()
export class EstablishmentService {
  private readonly logger = new Logger(EstablishmentService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    private readonly stripe: StripeService,
    @InjectQueue('emails') private readonly emailQueue: Queue,
    @Inject('APP_URL') private readonly appUrl: string,
    private readonly clerkService: ClerkService,
  ) { }

  // ─── Queries ────────────────────────────────────────────────────────

  async getEstablishmentInfo(id: string) {
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
              select: { id: true, url: true },
            },
          },
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

    return establishment;
  }

  /**
   * Full establishment info including all relations.
   * Used internally (e.g. for update operations).
   */
  private async getFullEstablishmentInfo(id: string) {
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
            logoImage: { select: { id: true, url: true } },
            bannerImage: { select: { id: true, url: true } },
          },
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

    return establishment;
  }

  async getSubscription(establishmentId: string) {
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

    return subscription;
  }

  // ─── Mutations ──────────────────────────────────────────────────────

  async createEstablishment(
    createEstablishmentDto: CreateEstablishmentDto,
    user: User,
  ) {
    const countryCode = (
      createEstablishmentDto.establishmentDetails.countryCode || 'PT'
    ).toUpperCase();
    const phonePrefixes: Record<string, string> = { PT: '+351', ES: '+34' };
    const phonePrefix = phonePrefixes[countryCode] || '+351';

    const cleanPhone =
      createEstablishmentDto.establishmentDetails.phoneNumber.replace(/\D/g, '');
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
        ? [{ type: 'eu_vat', value: countryCode + cleanTaxId }]
        : [],
      metadata: {
        business_name: createEstablishmentDto.establishmentDetails.billingName,
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
        establishmentDetails: {
          create: {
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

    if (!establishment.establishmentDetails) {
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

      const updatedDetails = await prisma.establishmentDetails.update({
        where: { id: establishment.establishmentDetails!.id },
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

    return result;
  }

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
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = this.generateSlug(name);
    let exists = await this.prisma.establishment.findUnique({ where: { slug } });

    while (exists) {
      slug = this.generateSlug(name) + '-' + ulid().slice(-4);
      exists = await this.prisma.establishment.findUnique({ where: { slug } });
    }

    return slug;
  }
}
