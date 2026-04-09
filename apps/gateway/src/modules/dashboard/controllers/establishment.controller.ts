import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
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
  SCHEDULE_VALIDATION_GROUPS
} from '@weats/common';
import type { Establishment, User } from '@weats/types';
import { CreateEstablishmentDto, UpdateEstablishmentLanguagesDto } from '@weats/contracts/dashboard/dtos/establishment';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { UpdateEstablishmentBrandingDto } from '@weats/contracts/dashboard/dtos/establishment/update-establishment-branding.dto';
import { ClerkService } from '@weats/integrations';
import { CreateScheduleDto } from '@weats/contracts/dashboard/dtos/schedule';
import { UpdateEstablishmentDigitalSettingsDto, UpdateEstablishmentGeneralSettingsDto, UpdateEstablishmentSystemSettingsDto } from '@weats/contracts';
import { UpdateEstablishmentBrandingSettingsDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-branding-settings.dto';

@Controller('establishments')
export class EstablishmentController {
  constructor(
    @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    private readonly featureUsageService: FeatureUsageService,
    private readonly clerkService: ClerkService,
  ) { }

  @Get('test')
  test() {
    return this.clerkService.getUsers();
  }

  @Get('verify-domain')
  @UseGuards(ClerkGuard)
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


  @UseGuards(ClerkGuard)
  @Post()
  createEstablishment(
    @Body() createEstablishmentDto: CreateEstablishmentDto,
    @CurrentUser() user: User,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_CREATE, { createEstablishmentDto, user });
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get('subscription')
  getSubscription(@CurrentEstablishment() establishment: Establishment) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SUBSCRIPTION, { id: establishment.id });
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get('portal-session')
  getPortalSession(@CurrentEstablishment() establishment: Establishment) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_PORTAL_SESSION, { id: establishment.id });
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Post('subscription')
  subscribeToPlan(
    @Body() { planCycleId }: { planCycleId: string },
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_SUBSCRIBE_TO_PLAN, { planCycleId, establishment });
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get('cancel-subscription')
  cancelSubscription(
    @CurrentEstablishment() establishment: Establishment,
    @CurrentUser() user: User,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_CANCEL_SUBSCRIPTION, { id: establishment.id, user });
  }

  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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

  //Settings
  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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


  /*
  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SETTINGS_DIGITAL_MENU, { id });
  }
  
  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_GET_SETTINGS_SYSTEM, { id });
  }
    */

  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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

  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get(':id/settings/favicon/process')
  processEstablishmentFavicon(
    @CurrentEstablishment() establishment: Establishment,
    @Body() 
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
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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



  /*
  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_BRANDING, { id, updateEstablishmentBrandingSettingsDto });
  }

  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_BILLING, { id, updateEstablishmentBillingSettingsDto });
  }

  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_DIGITAL_MENU, { id, updateEstablishmentDigitalSettingsDto });
  }

  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SETTINGS_SYSTEM, { id, updateEstablishmentSystemSettingsDto });
  }

  */

  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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

  @UsePipes(new ValidationPipe({ groups: [SCHEDULE_VALIDATION_GROUPS.ESTABLISHMENT] }))
  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Post(':id/schedule')
  updateEstablishmentSchedule(
    @CurrentEstablishment() establishment: Establishment,
    @Body() updateEstablishmentScheduleDto: CreateScheduleDto,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE_SCHEDULE, { establishment, updateEstablishmentScheduleDto });
  }


  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Put(':id')
  updateEstablishment(
    @Param('id') id: string,
    @Body() updateEstablishmentDto: CreateEstablishmentDto,
    @CurrentUser() user: User,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.ESTABLISHMENT_UPDATE, { id, updateEstablishmentDto, user });
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
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
}
