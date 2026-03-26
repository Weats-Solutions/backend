import {
  Controller
} from '@nestjs/common';
import { VariantOptionsService } from './variant-options.service';
import { CreateVariantOptionDto, UpdateVariantOptionDto } from '@weats/contracts';
import { Establishment } from '@weats/types';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common';

@Controller()
export class VariantOptionsController {
  constructor(private readonly service: VariantOptionsService) { }

  @MessagePattern(DASHBOARD_PATTERNS.VARIANT_OPTION_CREATE)
  async create(
    @Payload() payload: { establishment: Establishment, createVariantOptionDto: CreateVariantOptionDto },
  ) {
    return this.service.create(payload.establishment, payload.createVariantOptionDto);
  }

  @MessagePattern(DASHBOARD_PATTERNS.VARIANT_OPTION_GET_BY_ESTABLISHMENT)
  async listAll(@Payload() payload: { establishment: Establishment }) {
    return this.service.findAll(payload.establishment);
  }

  @MessagePattern(DASHBOARD_PATTERNS.VARIANT_OPTION_GET_BY_ID)
  async get(@Payload() payload: { id: string }) {
    return this.service.getById(payload.id);
  }

  @MessagePattern(DASHBOARD_PATTERNS.VARIANT_OPTION_EDIT)
  async update(
    @Payload() payload: { id: string, updateVariantOptionDto: UpdateVariantOptionDto, establishment: Establishment },
  ) {
    return this.service.update(payload.id, payload.updateVariantOptionDto, payload.establishment);
  }

  @MessagePattern(DASHBOARD_PATTERNS.VARIANT_OPTION_DELETE)
  async remove(
    @Payload() payload: { id: string, establishment: Establishment },
  ) {
    return this.service.remove(payload.id, payload.establishment);
  }
}
