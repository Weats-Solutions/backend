import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LANDING_PATTERNS } from '@weats/common/patterns/landing.patterns';
import { ContactDto } from '@weats/contracts';
import { LandingService } from './landing.service';

@Controller()
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @MessagePattern(LANDING_PATTERNS.LEAD_CREATE)
  createLead(@Payload() dto: ContactDto) {
    return this.landingService.createLead(dto);
  }
}
