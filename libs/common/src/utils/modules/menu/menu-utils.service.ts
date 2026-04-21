import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisConfigService } from '@weats/configs';

export type MenuCacheType = 'theme' | 'settings' | 'menus' | 'menu-detail';

@Injectable()
export class MenuUtilsService implements OnModuleDestroy {
    private readonly logger = new Logger(MenuUtilsService.name);
    private readonly redis: Redis;

    constructor(private readonly redisConfig: RedisConfigService) {
        const options = this.redisConfig.getConnectionOptions('nextCache');

        this.redis = new Redis({
            ...options,
            lazyConnect: true,
            maxRetriesPerRequest: 2,
        });

        this.redis.connect().catch((err) => {
            this.logger.error(`[NextCache] Falha ao conectar ao Redis: ${err.message}`);
        });
    }

    onModuleDestroy() {
        this.redis.disconnect();
    }

    /**
     * Apaga a cache do frontend (Next.js) diretamente no Redis.
     * 
     * Estrutura de keys:
     *   {slug}:theme:{lang}
     *   {slug}:settings:{lang}
     *   {slug}:menus:{lang}
     *   {slug}:menu-detail:{menuId}:{lang}
     * 
     * @param type - Secção da cache a limpar
     * @param slug - Slug do estabelecimento
     * @param menuId - ID do menu (apenas para 'menu-detail')
     */
    clearMenuCacheAsync(type: MenuCacheType, slug: string, menuId?: string) {
        if (!slug) return;

        // Constrói o pattern de pesquisa
        let pattern: string;

        if (type === 'menu-detail' && menuId) {
            // Apaga apenas as caches deste menu específico (todas as línguas)
            pattern = `${slug}:menu-detail:${menuId}:*`;
        } else if (type === 'menu-detail' && !menuId) {
            // Apaga TODOS os detalhes de menu deste estabelecimento
            pattern = `${slug}:menu-detail:*`;
        } else {
            // theme, settings, menus → apaga todas as línguas desta secção
            pattern = `${slug}:${type}:*`;
        }

        // Fire-and-forget: não bloquear a resposta do API
        void this.deleteByPattern(pattern).catch((err) => {
            this.logger.warn(`[NextCache] Falha ao limpar cache [${pattern}]: ${err.message}`);
        });
    }

    /**
     * Apaga TODA a cache de um estabelecimento (todas as secções e línguas).
     */
    clearAllCacheAsync(slug: string) {
        if (!slug) return;

        const pattern = `${slug}:*`;

        void this.deleteByPattern(pattern).catch((err) => {
            this.logger.warn(`[NextCache] Falha ao limpar toda a cache [${pattern}]: ${err.message}`);
        });
    }

    /**
     * Usa SCAN para encontrar keys e DEL para as apagar.
     * SCAN é preferível a KEYS porque não bloqueia o Redis.
     */
    private async deleteByPattern(pattern: string): Promise<number> {
        let cursor = '0';
        let totalDeleted = 0;

        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;

            if (keys.length > 0) {
                const deleted = await this.redis.del(...keys);
                totalDeleted += deleted;
            }
        } while (cursor !== '0');

        if (totalDeleted > 0) {
            this.logger.debug(`[NextCache] Apagadas ${totalDeleted} keys com pattern: ${pattern}`);
        }

        return totalDeleted;
    }
}