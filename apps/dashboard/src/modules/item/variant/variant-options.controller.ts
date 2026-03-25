import {
  Controller
} from '@nestjs/common';
import { VariantOptionsService } from './variant-options.service';
import { CreateVariantOptionDto, UpdateVariantOptionDto } from '@weats/contracts';
import { Establishment } from '@weats/types';
import { Payload } from '@nestjs/microservices';

@Controller()
export class VariantOptionsController {
  constructor(private readonly service: VariantOptionsService) { }

  async create(
    @Payload() payload: { establishment: Establishment, createVariantOptionDto: CreateVariantOptionDto },
  ) {
    return this.service.create(payload.establishment, payload.createVariantOptionDto);
  }

  async listAll(@Payload() payload: { establishment: Establishment }) {
    return this.service.findAll(payload.establishment);
  }

  async get(@Payload() payload: { id: string }) {
    return this.service.getById(payload.id);
  }

  async update(
    @Payload() payload: { id: string, updateVariantOptionDto: UpdateVariantOptionDto, establishment: Establishment },
  ) {
    return this.service.update(payload.id, payload.updateVariantOptionDto, payload.establishment);
  }
  async remove(
    @Payload() payload: { id: string, establishment: Establishment },
  ) {
    return this.service.remove(payload.id, payload.establishment);
  }
}
