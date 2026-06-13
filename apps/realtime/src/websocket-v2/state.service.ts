import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisConfigService } from '@weats/configs/redis-config.service';
import Redis from 'ioredis';
import { CallRequestedPayload } from './realtime-v2.types';

@Injectable()
export class RealtimeStateService implements OnModuleInit {
    private readonly logger = new Logger(RealtimeStateService.name);
    private redis: Redis;

    constructor(private readonly redisConfig: RedisConfigService) {}

    onModuleInit() {
        const options = this.redisConfig.getConnectionOptions('realtime');
        this.redis = new Redis(options);

        this.redis.on('connect', () => {
            this.logger.log(`✅ REDIS: Ligado com sucesso à DB ${options.db} para Estado Realtime.`);
        });

        this.redis.on('error', (err) => {
            this.logger.error('❌ REDIS ERROR:', err);
        });
    }

    private getEstKey(estId: string) {
        return `realtime:active:est:${estId}`;
    }

    // Guardar um novo pedido com tipo estrito
    async saveActiveCall(estId: string, spId: string, clientId: string, payload: CallRequestedPayload) {
        const key = this.getEstKey(estId);
        const field = `${spId}:${clientId}`;
        this.logger.log(`[REDIS] Salvando pedido ativo em: ${key} -> ${field} (DB: ${this.redis.options.db})`);
        await this.redis.hset(key, field, JSON.stringify(payload));
        // Expiração de segurança (24h) para não acumular lixo se ninguém aceitar
        await this.redis.expire(key, 86400); 
    }

    // Buscar um pedido ativo específico
    async getActiveCall(estId: string, spId: string, clientId: string): Promise<CallRequestedPayload | null> {
        const key = this.getEstKey(estId);
        const field = `${spId}:${clientId}`;
        const data = await this.redis.hget(key, field);
        if (!data) return null;
        try {
            return JSON.parse(data) as CallRequestedPayload;
        } catch (err) {
            this.logger.error(`Failed to parse active call: ${data}`, err);
            return null;
        }
    }

    // Remover um pedido (quando aceite ou cancelado) com hdel em lote
    async removeActiveCall(estId: string, spId: string, clientId?: string) {
        const key = this.getEstKey(estId);
        
        if (clientId && clientId !== 'ALL') {
            await this.redis.hdel(key, `${spId}:${clientId}`);
        } else {
            // Se for 'ALL' ou undefined, removemos todos daquela mesa (cleanup em lote)
            this.logger.log(`[REDIS] Limpeza em lote para Mesa: ${spId} no Est: ${estId}`);
            const all = await this.redis.hgetall(key);
            const toDelete = Object.keys(all).filter(field => field.startsWith(`${spId}:`));
            if (toDelete.length > 0) {
                await this.redis.hdel(key, ...toDelete);
            }
        }
    }

    // Buscar todos os pedidos pendentes de um estabelecimento com try/catch robusto
    async getActiveCalls(estId: string): Promise<CallRequestedPayload[]> {
        const key = this.getEstKey(estId);
        this.logger.log(`[REDIS] Lendo pedidos pendentes para estabelecimento: ${estId} (DB: ${this.redis.options.db})`);
        const data = await this.redis.hgetall(key);
        
        const results: CallRequestedPayload[] = [];
        for (const val of Object.values(data)) {
            try {
                results.push(JSON.parse(val) as CallRequestedPayload);
            } catch (err) {
                this.logger.error(`Failed to parse active call payload from list: ${val}`, err);
            }
        }

        this.logger.log(`[REDIS] Encontrados ${results.length} pedidos em cache.`);
        return results;
    }

    async clearAll(estId: string) {
        await this.redis.del(this.getEstKey(estId));
    }

    // ─── BLOQUEIOS DE MESA (REDIS PERSISTENTE) ──────────────────────────────────
    
    private getBlockKey(estId: string) {
        return `realtime:blocks:est:${estId}`;
    }

    async saveTableBlock(estId: string, spId: string, durationMs: number) {
        const key = this.getBlockKey(estId);
        const expiresAt = Date.now() + durationMs;
        await this.redis.zadd(key, expiresAt, spId);
        await this.redis.expire(key, 86400); // 24h cleanup
        this.logger.log(`[REDIS] Mesa ${spId} bloqueada até ${new Date(expiresAt).toISOString()}`);
    }

    async getBlockedTablesSnapshot(estId: string): Promise<Record<string, string>> {
        const key = this.getBlockKey(estId);
        const now = Date.now();
        
        this.logger.log(`[REDIS] Gerando snapshot de mesas bloqueadas para Est: ${estId} (DB: ${this.redis.options.db})`);

        // 1. Limpar bloqueios expirados no Redis
        await this.redis.zremrangebyscore(key, '-inf', now);

        // 2. Buscar todos os bloqueios ativos
        const blocks = await this.redis.zrange(key, 0, -1, 'WITHSCORES');
        const snapshot: Record<string, string> = {};

        // Redis devolve [id1, score1, id2, score2, ...]
        for (let i = 0; i < blocks.length; i += 2) {
            const spId = blocks[i];
            const expiresAt = parseInt(blocks[i + 1]);
            snapshot[spId] = new Date(expiresAt).toISOString();
        }

        this.logger.log(`[REDIS] Encontradas ${Object.keys(snapshot).length} mesas bloqueadas ativas.`);
        return snapshot;
    }

    async isTableBlocked(estId: string, spId: string): Promise<boolean> {
        const key = this.getBlockKey(estId);
        const score = await this.redis.zscore(key, spId);
        if (!score) return false;
        return parseInt(score) > Date.now();
    }

    async removeTableBlock(estId: string, spId: string) {
        const key = this.getBlockKey(estId);
        await this.redis.zrem(key, spId);
        this.logger.log(`[REDIS] Mesa ${spId} DESBLOQUEADA manualmente.`);
    }
}
