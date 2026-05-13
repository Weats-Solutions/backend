import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '@weats/cache';

@Injectable()
export class MenuUtilsService {
    private readonly logger = new Logger(MenuUtilsService.name);

    constructor(private readonly cacheService: CacheService) {}

    /**
     * Limpa a cache de definições core (configurações, tema, etc)
     */
    async clearCoreCache(slug: string) {
        await this.cacheService.clearCoreCache(slug);
    }

    /**
     * Limpa a cache das listas de menus (todas as línguas e targets)
     */
    async clearMenuListCache(slug: string) {
        await this.cacheService.clearMenuListCache(slug);
    }

    /**
     * Limpa a cache do conteúdo de um menu específico ou de todos os menus
     */
    async clearMenuContentCache(slug: string, menuId?: string) {
        await this.cacheService.clearMenuContentCache(slug, menuId);
    }

    /**
     * Limpa TODA a cache de um estabelecimento (definições, listas e conteúdos)
     */
    async clearEstablishmentCache(slug: string) {
        await this.cacheService.clearEstablishmentCache(slug);
    }

    /**
     * Mantido para compatibilidade temporária durante a refatoração
     */
    async clearMenuCacheAsync(type: 'settings' | 'menus' | 'menu-detail', slug: string, menuId?: string) {
        if (!slug) return;

        switch (type) {
            case 'settings':
                void this.clearCoreCache(slug);
                break;
            case 'menus':
                void this.clearMenuListCache(slug);
                break;
            case 'menu-detail':
                void this.clearMenuContentCache(slug, menuId);
                break;
        }
    }

    /**
     * Mantido para compatibilidade temporária
     */
    async clearAllCacheAsync(slug: string) {
        void this.clearEstablishmentCache(slug);
    }
}