import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
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
} from '@weats/common';
import type { Establishment, User } from '@weats/types';
import { EstablishmentLanguage } from '@weats/database';
import { ERRORS } from '@weats/common';
import { CreateEstablishmentDto } from '@weats/contracts/dashboard/dtos/establishment';
import { EstablishmentService } from './establishment.service';

@Controller('establishments')
export class EstablishmentController {
  constructor(
    private readonly establishmentService: EstablishmentService,
  ) {}

  @Post('/:id/add-language')
  AddLanguage(
    @Param('id') id: string,
    @Body() { languages }: { languages: EstablishmentLanguage[] },
  ) {
    return this.establishmentService.addLanguage(id, languages);
  }

  @UseGuards(ClerkGuard)
  @Post()
  CreateEstablishment(
    @Body() createEstablishmentDto: CreateEstablishmentDto,
    @CurrentUser() user: User,
  ) {
    return this.establishmentService.createEstablishment(
      createEstablishmentDto,
      user,
    );
  }

  @Roles()
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get('/info/:id')
  getEstablishmentInfo(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    if (establishment.id !== id) {
      throw new ForbiddenException({
        message: 'You do not have access to this establishment',
        code: ERRORS.FORBIDDEN,
      });
    }
    return this.establishmentService.getEstablishmentInfo(id);
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get('subscription')
  getSubscription(@CurrentEstablishment() establishment: Establishment) {
    return this.subscriptionService.getSubscription(establishment.id);
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get('portal-session')
  getPortalSession(@CurrentEstablishment() establishment: Establishment) {
    return this.establishmentService.getPortalSession(establishment);
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Post('subscription')
  SubscribeToPlan(
    @Body() subscribeToPlanDto: SubscribeToPlanDto,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.establishmentService.subscribeToPlan(
      subscribeToPlanDto.planCycleId,
      establishment,
    );
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get('/cancel-subscription')
  CancelSubscription(
    @CurrentEstablishment() establishment: Establishment,
    @CurrentUser() user: User,
  ) {
    return this.subscriptionService.cancelSubscription(establishment.id, user);
  }

  @UseGuards(ClerkGuard)
  @Put(':id')
  updateEstablishment(
    @Param('id') id: string,
    @Body() updateEstablishmentDto: CreateEstablishmentDto,
    @CurrentUser() user: User,
  ) {
    return this.establishmentService.updateEstablishment(
      id,
      updateEstablishmentDto,
      user,
    );
  }
}
