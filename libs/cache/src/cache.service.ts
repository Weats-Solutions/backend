import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject('CACHE_REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /**
   * O "Santo Graal" do Cache: Tenta obter do Redis, se não existir executa o fetcher,
   * guarda no Redis e devolve. Tudo tipado.
   *
   * @param key Chave da cache
   * @param ttlInSeconds Tempo de vida em segundos
   * @param fetcher Função que vai buscar os dados à fonte original (DB)
   */
  async wrap<T>(
    key: string,
    ttlInSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch (err) {
      this.logger.error(`Error reading from cache for key "${key}"`, err);
    }

    // Cache miss -> Executar a função original
    const result = await fetcher();

    // Guardar o resultado se não for null/undefined
    if (result !== null && result !== undefined) {
      try {
        await this.set(key, result, ttlInSeconds);
      } catch (err) {
        this.logger.error(`Error writing to cache for key "${key}"`, err);
      }
    }

    return result;
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
    const data = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlInSeconds) {
      await this.redis.set(key, data, 'EX', ttlInSeconds);
    } else {
      await this.redis.set(key, data);
    }
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Apaga múltiplas chaves usando um padrão (ex: "user:123:*")
   * Usa SCAN em vez de KEYS para não bloquear o Redis em produção.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    });

    stream.on('data', async (keys: string[]) => {
      if (keys.length > 0) {
        const pipeline = this.redis.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }
    });

    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  // ═══════════════════════════════════════════
  // CATALOG SPECIFIC INVALIDATION
  // ═══════════════════════════════════════════

async clearAllEstablishmentCache(slug: string) {
  this.clearCoreCache(slug);
  this.clearEstablishmentCache(slug);
} 

  /**
   * Limpa a cache de definições core (configurações, tema, etc)
   */
  async clearCoreCache(slug: string) {
    const key = `catalog:est:${slug}:core`;
    await this.invalidate(key);
    this.logger.debug(`[Cache] Cache CORE limpa para: ${slug}`);
  }

  /**
   * Limpa a cache das listas de menus (todas as línguas e targets)
   */
  async clearMenuListCache(slug: string) {
    const pattern = `catalog:est:${slug}:lang:*:menu*`;
    await this.invalidatePattern(pattern);
  }

  /**
   * Limpa a cache do conteúdo de um menu específico ou de todos os menus
   */
  async clearMenuContentCache(slug: string, menuId?: string) {
    const pattern = `catalog:est:${slug}:lang:*:menu:${menuId || '*'}:content`;
    await this.invalidatePattern(pattern);
  }

  /**
   * Limpa TODA a cache de um estabelecimento (definições, listas e conteúdos)
   */
  async clearEstablishmentCache(slug: string) {
    const pattern = `catalog:est:${slug}:*`;
    await this.invalidatePattern(pattern);
  }
}
