import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CreateVariantOptionDto, UpdateVariantOptionDto } from '@weats/contracts';
import { Establishment, feature } from '@weats/types';
import { UseGuards } from '@nestjs/common';
import { ClerkGuard, EstablishmentStaffGuard, CurrentEstablishment, RequiresFeature, FeatureLimitGuard } from '@weats/common';
import { Inject } from '@nestjs/common';
import { DASHBOARD_SERVICE, DASHBOARD_PATTERNS } from '@weats/common';
import { ClientProxy } from '@nestjs/microservices';


@Controller('items/variants-options')
export class VariantOptionsController {
  constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

  @RequiresFeature(feature.custom_variants)
  @UseGuards(FeatureLimitGuard)
  @Post()
  async create(
    @CurrentEstablishment() establishment: Establishment,
    @Body() createVariantOptionDto: CreateVariantOptionDto,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_CREATE, { establishment, createVariantOptionDto });
  }

  @Get()
  async listAll(@CurrentEstablishment() establishment: Establishment) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_GET_BY_ESTABLISHMENT, { establishment });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_GET_BY_ID, { id });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVariantOptionDto: UpdateVariantOptionDto,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_EDIT, { id, updateVariantOptionDto, establishment });
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.VARIANT_OPTION_DELETE, { id, establishment });
  }
}
