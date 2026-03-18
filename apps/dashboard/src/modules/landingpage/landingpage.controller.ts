import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { EstablishmentLanguage } from '@weats/database';
import { LandingpageService } from './landingpage.service';

@Controller()
export class LandingpageController {
    constructor(
        private readonly landingpageService: LandingpageService,
    ) { }

    @MessagePattern(DASHBOARD_PATTERNS.LANDINGPAGE_GET_BY_SLUG)
    getLandingpage(@Payload() payload: { establishmentSlug: string; lang: EstablishmentLanguage }) {
        return this.landingpageService.getLandingpage(payload.establishmentSlug, payload.lang);
    }
}