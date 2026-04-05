import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export type MenuCacheType = 'theme' | 'settings' | 'menus';

@Injectable()
export class MenuUtilsService {
    constructor(
        private readonly httpService: HttpService,
        @Inject('MENU_URL') private readonly menuUrl: string,
        @Inject('MENU_CACHE_TOKEN') private readonly menuCacheToken: string,
    ) { }

    /**
     * Limpa a cache baseada no tipo. 
     * Se o tipo for 'menus', o menuId é obrigatório para construir o path corretamente.
     */
    async clearMenuCacheAsync(type: MenuCacheType, slug: string, menuId?: string) {
        if (!slug) return;

        // Construção dinâmica do endpoint
        // Se for 'menus', adiciona o ID. Caso contrário, usa apenas o tipo.
        const endpoint = type === 'menus' && menuId
            ? `${type}/${menuId}`
            : type;

        const url = `${this.menuUrl}/api/clear-cache/${endpoint}`;

        try {
            await firstValueFrom(
                this.httpService.post(
                    url,
                    { slug },
                    {
                        headers: {
                            Authorization: `Bearer ${this.menuCacheToken}`,
                        },
                    },
                ),
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[MenuUtilsService] Cache clear failed for ${type}: ${message}`);
        }
    }
}