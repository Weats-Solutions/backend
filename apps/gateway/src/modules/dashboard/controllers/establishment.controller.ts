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
} from '@nestjs/common';
import {
  ClerkGuard,
  CurrentUser,
  Roles,
  CurrentEstablishment,
  EstablishmentStaffGuard,
  DASHBOARD_SERVICE,
  ERRORS,
  FeatureLimitGuard,
  RequiresFeature,
  FeatureUsageService,
} from '@weats/common';
import type { Establishment, User } from '@weats/types';
import { CreateEstablishmentDto, UpdateEstablishmentLanguagesDto } from '@weats/contracts/dashboard/dtos/establishment';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { UpdateEstablishmentBrandingDto } from '@weats/contracts/dashboard/dtos/establishment/update-establishment-branding.dto';

@Controller('establishments')
export class EstablishmentController {
  constructor(
    @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    private readonly featureUsageService: FeatureUsageService,
  ) { }

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

  @UseGuards(ClerkGuard)
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
