import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { ThrottlePublic } from '@weats/common/decorators/throttle.decorator';
import { EstablishmentLanguage } from '@weats/database';
import { ToUpperCasePipe } from '@weats/common/pipes/upper-case.pipe';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '@weats/common/constants/services';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';

@Controller('landingpage')
@ThrottlePublic()
export class LandingpageController {
    constructor(
        @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
        //@Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    /*
      @Post('/clear-cache')
      async clearCache() {
        await clearCacheByPattern(this.cacheManager, 'landingpage:*');
        return { success: true };
      }
    
      @Post('/clear-cache/:establishmentSlug')
      async clearCacheByEstablishmentSlug(
        @Param('establishmentSlug') establishmentSlug: string,
      ) {
        await clearCacheByPattern(this.cacheManager, `landingpage:${establishmentSlug}:*`);
        return { success: true };
      }
        */

    @Get('/:establishmentSlug')
    async getLandingpage(
        @Param('establishmentSlug') establishmentSlug: string,
        @Query('lang', ToUpperCasePipe) lang: EstablishmentLanguage,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.LANDINGPAGE_GET_BY_SLUG, { establishmentSlug, lang });
    }

}
