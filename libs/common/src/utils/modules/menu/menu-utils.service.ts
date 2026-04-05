import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MenuUtilsService {
    constructor(private readonly httpService: HttpService,
        @Inject('MENU_URL') private readonly menuUrl: string,
        @Inject('MENU_CACHE_TOKEN') private readonly menuCacheToken: string,
    ) {

    }

    clearMenuCacheAsync(slug?: string | null) {
        if (!slug) return;

        void firstValueFrom(this.httpService.post(
            `${this.menuUrl}/api/clear-cache`,
            { slug },
            {
                headers: {
                    Authorization: `Bearer ${this.menuCacheToken}`,
                },
            },
        )).catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`Menu cache clear failed: ${message}`);
        });
    }
}