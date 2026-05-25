import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS, normalizeSchedule } from '@weats/common';
import {
  EstablishmentInformationsDto,
  EstablishmentLocationDto,
  UpdateEstablishmentGeneralSettingsDto,
} from '@weats/contracts';
import { CreateScheduleDto } from '@weats/contracts/dashboard/dtos/schedule';
import { CorePrismaService, ScheduleType } from '@weats/database';
import { StripeService } from '@weats/integrations';
import { CacheService } from '@weats/cache';
import { Establishment } from '@weats/types';

@Injectable()
export class EstablishmentGeneralSettingsService {
  private readonly logger = new Logger(EstablishmentGeneralSettingsService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    private readonly stripeService: StripeService,
    private readonly cacheService: CacheService,
  ) { }

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
        type: true,
        schedule: {
          include: { days: { include: { intervals: true } } },
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
      informations: {
        name: establishment.name,
        email: establishment.email,
        phoneNumber: establishment.phoneNumber,
        countryCode: establishment.countryCode,
        type: establishment.type,
      },
      location: {
        address: establishment.address,
        city: establishment.city,
        state: establishment.state,
        zipCode: establishment.zipCode,
        country: establishment.country,
      },
      schedule: establishment.schedule
        ? normalizeSchedule(establishment.schedule)
        : null,
    };
  }

  async updateEstablishmentGeneralSettings(
    establishment: Establishment,
    dto: UpdateEstablishmentGeneralSettingsDto,
  ) {
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

    await this.cacheService.clearEstablishmentCache(establishment.slug)


    return result;
  }

  private async updateInformations(
    id: string,
    data: EstablishmentInformationsDto,
  ) {
    const establishment = await this.prisma.establishment.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        countryCode: data.countryCode,
        phoneNumber: data.phoneNumber,
        type: data.type,
      },
    });

    if (establishment.stripeCustomerId) {
      const cleanPhone = data.phoneNumber?.replace(/\D/g, '');
      try {
        await this.stripeService.updateCustomer(establishment.stripeCustomerId, {
          name: data.name,
          email: data.email,
          phone: cleanPhone ? `${data.countryCode}${cleanPhone}` : undefined,
          metadata: {
            establishmentName: data.name,
            establishmentId: establishment.id,
          },
        });
      } catch (error) {
        this.logger.error('Failed to sync informations to Stripe', error);
      }
    }

    return establishment;
  }

  private async updateLocation(id: string, data: EstablishmentLocationDto) {
    const establishment = await this.prisma.establishment.update({
      where: { id },
      data: {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
      },
    });

    if (establishment.stripeCustomerId) {
      try {
        await this.stripeService.updateCustomer(establishment.stripeCustomerId, {
          address: {
            line1: data.address,
            city: data.city,
            state: data.state,
            postal_code: data.zipCode,
            country: data.country,
          },
        });
      } catch (error) {
        this.logger.error('Failed to sync location to Stripe', error);
      }
    }

    return establishment;
  }

  private async updateSchedule(id: string, data: CreateScheduleDto) {
    const establishmentWithSchedule =
      await this.prisma.establishment.findUnique({
        where: { id },
        select: { scheduleId: true },
      });

    if (!establishmentWithSchedule) {
      throw new RpcException({
        status: 400,
        message: ERRORS.ESTABLISHMENT_NOT_FOUND,
        code: ERRORS.ESTABLISHMENT_NOT_FOUND,
      });
    }

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
    }

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
