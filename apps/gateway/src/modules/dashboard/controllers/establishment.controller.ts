import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Patch,
  Post, UseGuards,
  UsePipes,
  ValidationPipe, Query
} from '@nestjs/common';
import {
  ClerkGuard,
  CurrentUser,
  Roles,
  CurrentEstablishment,
  EstablishmentStaffGuard,
  DASHBOARD_SERVICE,
  ERRORS, FeatureUsageService,
  SCHEDULE_VALIDATION_GROUPS,
  RateLimit,
  SkipActiveSubscription,
  SkipEstablishmentStaff,
} from '@weats/common';
import type { Establishment, SendEmailDto, User } from '@weats/types';
import { CreateEstablishmentDto, UpdateEstablishmentLanguagesDto } from '@weats/contracts/dashboard/dtos/establishment';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { UpdateEstablishmentBrandingDto } from '@weats/contracts/dashboard/dtos/establishment/update-establishment-branding.dto';
import { CreateScheduleDto } from '@weats/contracts/dashboard/dtos/schedule';
import { EstablishmentLanguageDto, UpdateEstablishmentBillingSettingsDto, UpdateEstablishmentDigitalSettingsDto, UpdateEstablishmentGeneralSettingsDto, UpdateEstablishmentSystemSettingsDto } from '@weats/contracts';
import { UpdateEstablishmentBrandingSettingsDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-branding-settings.dto';
import { UpdateEstablishmentFaviconDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-favicon';
import { EmailTemplate } from '@weats/types';
import { EmailProducer } from '@weats/bull/producers/email.producer';
import { UpdateEstablishmentModuleSettingsDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-module-settings.dto';

@Controller('establishments')
export class EstablishmentController {
  constructor(
    @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    private readonly featureUsageService: FeatureUsageService,
    private readonly emailProducer: EmailProducer,
  ) { }

  // -------------------------------------------------------------------------
  // Life Cycle
  // -------------------------------------------------------------------------

  @Get('test')
  async test() {
    const payload: SendEmailDto<EmailTemplate.WELCOME> = {
      to: "afonsovelosof@gmail.com",
      template: EmailTemplate.WELCOME,
      lang: "pt",
      context: {
        firstName: "Afonso",
        lastName: "Costa",
        redirectUrl: "https://weats.pt",
      },
    };

    await this.emailProducer.send(payload);
  }

  @Post()
  @SkipActiveSubscription()
  @SkipEstablishmentStaff()
  @RateLimit('STRICT') // 5 req/min — criar establishment é raro e envolve Stripe + DB
  createEstablishment(
    @Body() createEstablishmentDto: CreateEstablishmentDto,
    @CurrentUser() user: User,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_CREATE, { createEstablishmentDto, user });
  }

  @Delete('test/:id')
  async testDelete(@Param('id') id: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new ForbiddenException('This route is only available in development mode.');
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_DELETE_TEST, { id });
  }

  @Roles()
  @Delete(':id/menu-cache')
  deleteEstablishmentMenuCache(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_DELETE_MENU_CACHE, { id });
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  @Roles()

  @Get(':id')
  getEstablishmentInfo(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_BY_ID, { id });
  }

  @SkipEstablishmentStaff()
  @SkipActiveSubscription()
  @Roles()
  @Get(':id/access')
  getEstablishmentAccess(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_ACCESS, { id });
  }

  @Roles()

  @Get(':id/schedule')
  getEstablishmentSchedule(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SCHEDULE_BY_ID, { id: establishment.id });
  }

  // -------------------------------------------------------------------------
  // Modules Settings
  // -------------------------------------------------------------------------
  @Roles()

  @Get(':id/settings/modules')
  getEstablishmentModulesSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_MODULES_SETTINGS, { id });
  }

  @Roles()

  @Patch(':id/settings/modules')
  updateEstablishmentModuleSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
    @Body() updateEstablishmentModuleSettingsDto: UpdateEstablishmentModuleSettingsDto,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_MODULE, { id, updateEstablishmentModuleSettingsDto });
  }

  // -------------------------------------------------------------------------
  // General Settings
  // -------------------------------------------------------------------------

  @Roles()

  @Get(':id/settings/general')
  getEstablishmentGeneralSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SETTINGS_GENERAL, { id });
  }

  @Roles()

  @Patch(':id/settings/general')
  updateEstablishmentGeneralSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
    @Body() updateEstablishmentGeneralSettingsDto: UpdateEstablishmentGeneralSettingsDto,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_GENERAL, { establishment, updateEstablishmentGeneralSettingsDto });
  }

  // -------------------------------------------------------------------------
  // Branding Settings
  // -------------------------------------------------------------------------

  @Roles()

  @Get(':id/settings/branding')
  getEstablishmentBrandingSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SETTINGS_BRANDING, { id });
  }

  @Roles()

  @Patch(':id/settings/branding')
  updateEstablishmentBrandingSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
    @Body() updateEstablishmentBrandingSettingsDto: UpdateEstablishmentBrandingSettingsDto,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_BRANDING, { establishment, updateEstablishmentBrandingSettingsDto });
  }

  @Roles()

  @Get(':id/settings/favicon/job/:jobId')
  getEstablishmentFaviconJobStatus(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
    @Param('jobId') jobId: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_FAVICON_JOB_STATUS, { jobId });
  }

  @Roles()

  @Post(':id/settings/favicon/process')
  @RateLimit('STRICT') // 5 req/min — job pesado: gera e faz upload de 5 variantes de imagem
  processEstablishmentFavicon(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
    @Body() updateEstablishmentFaviconDto: UpdateEstablishmentFaviconDto,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_PROCESS_FAVICON, { establishment, updateEstablishmentFaviconDto });
  }


  @Patch(':id/branding')
  updateBranding(
    @Body() updateEstablishmentBrandingDto: UpdateEstablishmentBrandingDto,
    @CurrentEstablishment() currentEstablishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_BRANDING, {
      establishmentId: currentEstablishment.id,
      updateEstablishmentBrandingDto,
    });
  }

  // -------------------------------------------------------------------------
  // Billing Settings
  // -------------------------------------------------------------------------

  @Roles()

  @Get(':id/settings/billing')
  getEstablishmentBillingSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SETTINGS_BILLING, { id });
  }

  @Roles()

  @Patch(':id/settings/billing')
  updateEstablishmentBillingSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
    @Body() updateEstablishmentBillingSettingsDto: UpdateEstablishmentBillingSettingsDto,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_BILLING, { establishment, updateEstablishmentBillingSettingsDto });
  }

  // -------------------------------------------------------------------------
  // Digital Settings
  // -------------------------------------------------------------------------

  @Roles()

  @Get(':id/settings/digital')
  getEstablishmentDigitalSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SETTINGS_DIGITAL, { establishment });
  }

  @Roles()

  @Patch(':id/settings/digital')
  updateEstablishmentDigitalSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
    @Body() updateEstablishmentDigitalSettingsDto: UpdateEstablishmentDigitalSettingsDto,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_DIGITAL, { establishment, updateEstablishmentDigitalSettingsDto });
  }

  @Get('verify-domain')
  verifyDomain(
    @Query('slug') slug: string,
  ) {
    if (!slug) {
      throw new BadRequestException({
        message: ERRORS.BAD_REQUEST,
        code: ERRORS.BAD_REQUEST,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_VERIFY_DOMAIN, { slug });
  }

  // -------------------------------------------------------------------------
  // System Settings
  // -------------------------------------------------------------------------

  @Roles()

  @Get(':id/settings/system')
  getEstablishmentSystemSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SETTINGS_SYSTEM, { establishment });
  }

  @Roles()

  @Patch(':id/settings/system')
  updateEstablishmentSystemSettings(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
    @Body() updateEstablishmentSystemSettingsDto: UpdateEstablishmentSystemSettingsDto,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_SYSTEM, { establishment, updateEstablishmentSystemSettingsDto });
  }

  @Roles()

  @Patch(':id/settings/languages')
  updateEstablishmentLanguages(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
    @Body() updateEstablishmentLanguagesDto: EstablishmentLanguageDto,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
        code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
      });
    }
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_LANGUAGES, { establishment, updateEstablishmentLanguagesDto });
  }


  @Patch(':id/languages')
  async updateLanguages(
    @Body() updateEstablishmentLanguagesDto: UpdateEstablishmentLanguagesDto,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    const { limit } = await this.featureUsageService.getUsageAndLimit('languages', establishment.id);
    if (limit !== null && updateEstablishmentLanguagesDto.availableLanguages.length > limit) {
      throw new ForbiddenException({
        message: ERRORS.FEATURE_LIMIT_REACHED,
        code: ERRORS.FEATURE_LIMIT_REACHED,
      });
    }

    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_LANGUAGES, { establishment, updateEstablishmentLanguagesDto });
  }

  @Get('sync-status/:jobId')
  async getSyncStatus(@Param('jobId') jobId: string) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_LANGUAGE_SYNC_STATUS, { jobId });
  }

  // -------------------------------------------------------------------------
  // Subscription
  // -------------------------------------------------------------------------


  @Get('subscription')
  getSubscription(@CurrentEstablishment() establishment: Establishment) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SUBSCRIPTION, { id: establishment.id });
  }


  @Get('subscription-and-plan')
  getSubscriptionAndPlan(@CurrentEstablishment() establishment: Establishment) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SUBSCRIPTION_AND_PLAN, { id: establishment.id });
  }


  @SkipActiveSubscription()
  @Get('portal-session')
  getPortalSession(@CurrentEstablishment() establishment: Establishment) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_PORTAL_SESSION, { id: establishment.id });
  }

  @SkipActiveSubscription()
  @Post('subscription')
  subscribeToPlan(
    @Body() { planCycleId }: { planCycleId: string },
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_SUBSCRIBE_TO_PLAN, { planCycleId, establishment });
  }

  @SkipActiveSubscription()
  @Get('cancel-subscription')
  cancelSubscription(
    @CurrentEstablishment() establishment: Establishment,
    @CurrentUser() user: User,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_CANCEL_SUBSCRIPTION, { id: establishment.id, user });
  }

  // -------------------------------------------------------------------------
  // Others
  // -------------------------------------------------------------------------

  @UsePipes(new ValidationPipe({ groups: [SCHEDULE_VALIDATION_GROUPS.ESTABLISHMENT] }))
  @Roles()

  @Post(':id/schedule')
  updateEstablishmentSchedule(
    @CurrentEstablishment() establishment: Establishment,
    @Body() updateEstablishmentScheduleDto: CreateScheduleDto,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SCHEDULE, { establishment, updateEstablishmentScheduleDto });
  }
}
