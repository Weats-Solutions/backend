import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Establishment, User } from '@weats/types';
import {
  ERRORS
} from '@weats/common';
import {
  CorePrismaService, ScheduleType
} from '@weats/database';
import { CreateScheduleDto } from '@weats/contracts/dashboard/dtos/schedule';
import { EstablishmentQueryService } from './services/establishment-query.service';
import { EstablishmentGeneralSettingsService } from './services/establishment-general-settings.service';
import { EstablishmentBillingSettingsService } from './services/establishment-billing-settings.service';
import { EstablishmentBrandingSettingsService } from './services/establishment-branding-settings.service';
import { EstablishmentDigitalSettingsService } from './services/establishment-digital-settings.service';
import { EstablishmentSystemSettingsService } from './services/establishment-system-settings.service';
import { EstablishmentSubscriptionService } from './services/establishment-subscription.service';
import { CreateEstablishmentDto, UpdateEstablishmentBillingSettingsDto, UpdateEstablishmentBrandingSettingsDto, UpdateEstablishmentDigitalSettingsDto, UpdateEstablishmentGeneralSettingsDto, UpdateEstablishmentLanguagesDto, UpdateEstablishmentSystemSettingsDto } from '@weats/contracts';
import { EstablishmentLifeCycleService } from './services/establishment-lifecycle.service';
import { EstablishmentModuleSettingsService } from './services/establishment-module-settings.service';
import { UpdateEstablishmentModuleSettingsDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-module-settings.dto';



@Injectable()
export class EstablishmentService {
  private readonly logger = new Logger(EstablishmentService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    private readonly establishmentLifeCycleService: EstablishmentLifeCycleService,
    private readonly establishmentQueryService: EstablishmentQueryService,
    private readonly establishmentModuleSettingsService: EstablishmentModuleSettingsService,
    private readonly establishmentBrandingSettingsService: EstablishmentBrandingSettingsService,
    private readonly establishmentDigitalSettingsService: EstablishmentDigitalSettingsService,
    private readonly establishmentGeneralSettingsService: EstablishmentGeneralSettingsService,
    private readonly establishmentSystemSettingsService: EstablishmentSystemSettingsService,
    private readonly establishmentBillingSettingsService: EstablishmentBillingSettingsService,
    private readonly establishmentSubscriptionService: EstablishmentSubscriptionService,


  ) { }

  // -------------------------------------------------------------------------
  // Life Cycle
  // -------------------------------------------------------------------------

  async createEstablishment(createEstablishmentDto: CreateEstablishmentDto, user: User) {
    return this.establishmentLifeCycleService.createEstablishment(createEstablishmentDto, user);
  }

  async deleteEstablishmentTest(id: string) {
    return this.establishmentLifeCycleService.deleteEstablishmentTest(id);
  }

  async deleteEstablishmentMenuCache(establishmentId: string) {
    return this.establishmentLifeCycleService.deleteEstablishmentMenuCache(establishmentId);
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------
  async getEstablishmentInfo(id: string) {
    return this.establishmentQueryService.getEstablishmentInfo(id);
  }

  async getEstablishmentAccess(id: string) {
    return this.establishmentQueryService.getEstablishmentAccess(id);
  }

  async getEstablishmentSchedule(id: string) {
    return this.establishmentQueryService.getEstablishmentSchedule(id);
  }

  // -------------------------------------------------------------------------
  // Modules Settings
  // -------------------------------------------------------------------------
  async getEstablishmentModuleSettings(id: string) {
    return this.establishmentModuleSettingsService.getEstablishmentModuleSettings(id);
  }

  async updateEstablishmentModuleSettings(id: string, updateEstablishmentModuleSettingsDto: UpdateEstablishmentModuleSettingsDto) {
    return this.establishmentModuleSettingsService.updateEstablishmentModuleSettings(id, updateEstablishmentModuleSettingsDto);
  }

  // -------------------------------------------------------------------------
  // General Settings
  // -------------------------------------------------------------------------
  async getEstablishmentGeneralSettings(id: string) {
    return this.establishmentGeneralSettingsService.getEstablishmentGeneralSettings(id);
  }

  async updateEstablishmentGeneralSettings(establishment: Establishment, updateEstablishmentGeneralSettingsDto: UpdateEstablishmentGeneralSettingsDto) {
    return this.establishmentGeneralSettingsService.updateEstablishmentGeneralSettings(establishment, updateEstablishmentGeneralSettingsDto);
  }

  // -------------------------------------------------------------------------
  // Branding Settings
  // -------------------------------------------------------------------------
  async getEstablishmentBrandingSettings(id: string) {
    return this.establishmentBrandingSettingsService.getEstablishmentBrandingSettings(id);
  }

  async updateEstablishmentBrandingSettings(establishment: Establishment, updateEstablishmentBrandingSettingsDto: UpdateEstablishmentBrandingSettingsDto) {
    return this.establishmentBrandingSettingsService.updateEstablishmentBrandingSettings(establishment, updateEstablishmentBrandingSettingsDto);
  }

  // -------------------------------------------------------------------------
  // Billing Settings
  // -------------------------------------------------------------------------
  async getEstablishmentBillingSettings(id: string) {
    return this.establishmentBillingSettingsService.getEstablishmentBillingSettings(id);
  }

  async updateEstablishmentBillingSettings(
    establishment: Establishment,
    updateEstablishmentBillingSettingsDto: UpdateEstablishmentBillingSettingsDto,
  ) {
    return this.establishmentBillingSettingsService.updateEstablishmentBillingSettings(
      establishment,
      updateEstablishmentBillingSettingsDto,
    );
  }

  // -------------------------------------------------------------------------
  // Digital Settings
  // -------------------------------------------------------------------------
  async getEstablishmentDigitalSettings(establishement: Establishment) {
    return this.establishmentDigitalSettingsService.getEstablishmentDigitalSettings(establishement);
  }

  async updateEstablishmentDigitalSettings(establishment: Establishment, updateEstablishmentDigitalSettingsDto: UpdateEstablishmentDigitalSettingsDto) {
    return this.establishmentDigitalSettingsService.updateEstablishmentDigitalSettings(establishment, updateEstablishmentDigitalSettingsDto);
  }

  async verifyDomain(slug: string) {
    return this.establishmentDigitalSettingsService.verifyDomain(slug);
  }


  // -------------------------------------------------------------------------
  // System Settings
  // -------------------------------------------------------------------------
  async getEstablishmentSystemSettings(establishment: Establishment) {
    return this.establishmentSystemSettingsService.getEstablishmentSystemSettings(establishment);
  }

  async updateEstablishmentSystemSettings(establishment: Establishment, updateEstablishmentSystemSettingsDto: UpdateEstablishmentSystemSettingsDto) {
    return this.establishmentSystemSettingsService.updateEstablishmentSystemSettings(establishment, updateEstablishmentSystemSettingsDto);
  }

  async updateLanguages(establishment: Establishment, updateEstablishmentLanguagesDto: UpdateEstablishmentLanguagesDto) {
    return this.establishmentSystemSettingsService.updateLanguages(establishment, updateEstablishmentLanguagesDto);
  }

  async getLanguageSyncStatus(jobId: string) {
    return this.establishmentSystemSettingsService.getLanguageSyncStatus(jobId);
  }

  // -------------------------------------------------------------------------
  // Subscription
  // -------------------------------------------------------------------------
  async getSubscription(id: string) {
    return this.establishmentSubscriptionService.getSubscription(id);
  }

  async getInvoices(id: string) {
    return this.establishmentSubscriptionService.getInvoices(id);
  }

  async getPortalSession(id: string) {
    return this.establishmentSubscriptionService.getPortalSession(id);
  }

  async subscribeToPlan(planCycleId: string, establishment: Establishment) {
    return this.establishmentSubscriptionService.subscribeToPlan(planCycleId, establishment);
  }

  async cancelSubscription(id: string, user: User) {
    return this.establishmentSubscriptionService.cancelSubscription(id, user);
  }

  // -------------------------------------------------------------------------
  // Others
  // -------------------------------------------------------------------------

  async upsertEstablishmentSchedule(
    establishment: Establishment,
    scheduleDto: CreateScheduleDto,
  ) {
    const establishmentWithSchedule =
      await this.prisma.establishment.findUnique({
        where: { id: establishment.id },
        select: { scheduleId: true },
      });

    if (!establishmentWithSchedule)
      throw new RpcException({
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






  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------


}
