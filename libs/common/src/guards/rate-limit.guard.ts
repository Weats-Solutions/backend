import {
    Injectable,
    CanActivate,
    ExecutionContext,
    Inject,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { ERRORS } from '../errors';
import { RATE_LIMIT_SKIP, RATE_LIMIT_KEY, RateLimitOptions, RateLimitPolicy, RATE_LIMIT_POLICIES } from '../decorators/rate-limit.decorator';
import { GLOBAL_RATE_LIMIT_POINTS, RATE_LIMIT_REDIS_TOKEN } from '@weats/rate-limit';

@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly logger = new Logger(RateLimitGuard.name);

    // Cache de limiters por config para evitar criar instâncias a cada request
    private readonly limiterCache = new Map<string, RateLimiterRedis>();

    constructor(
        @Inject('RATE_LIMITER')
        private readonly limiter: RateLimiterRedis,
        @Inject(RATE_LIMIT_REDIS_TOKEN)
        private readonly redisClient: Redis,
        private readonly reflector: Reflector,
    ) { }

    /**
     * Obtém ou cria um limiter com cache por combinação points:duration.
     * Evita criar uma nova instância de RateLimiterRedis a cada request.
     */
    private getRouteLimiter(options: RateLimitOptions): RateLimiterRedis {
        const cacheKey = `${options.points}:${options.duration}`;

        if (!this.limiterCache.has(cacheKey)) {
            const limiter = new RateLimiterRedis({
                storeClient: this.redisClient,
                keyPrefix: `rl:${options.points}:${options.duration}`,
                points: options.points,
                duration: options.duration,
            });

            this.limiterCache.set(cacheKey, limiter);
        }

        return this.limiterCache.get(cacheKey)!;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Verifica se deve ignorar (SkipRateLimit)
        const skip = this.reflector.getAllAndOverride<boolean>(RATE_LIMIT_SKIP, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skip) return true;

        // 2. Obtém opções ou política predefinida da rota
        const policyOrOptions = this.reflector.getAllAndOverride<RateLimitPolicy | RateLimitOptions>(RATE_LIMIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Resolve string (ex: 'AUTH') para { points, duration } — single source of truth
        const options: RateLimitOptions | undefined = !policyOrOptions
            ? undefined
            : typeof policyOrOptions === 'string'
                ? RATE_LIMIT_POLICIES[policyOrOptions]
                : policyOrOptions;

        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // 3. Gera a chave de identificação (User ID ou IP real)
        // Utilizadores autenticados são sempre identificados pelo ID — mais fiável.
        // Para utilizadores não autenticados, temos de extrair o IP real:
        //   - CF-Connecting-IP: injetado pelo Cloudflare com o IP original do cliente
        //   - X-Forwarded-For: injetado por qualquer proxy (1º valor = IP do cliente)
        //   - request.ip: fallback para desenvolvimento local sem proxy
        const rawIp: string =
            (request.headers['cf-connecting-ip'] as string) ||
            ((request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()) ||
            request.ip ||
            'unknown';

        //ADICIONADO PARA EVITAR PROBLEMAS COM IPv6
        const realIp = rawIp.replace(/:/g, '_');
        //FIM DA ADICIONADO

        const userIdentifier = request.user?.id
            ? `user:${request.user.id}`
            : `ip:${realIp}`;

        this.logger.log(`[RateLimit] Client ID: ${userIdentifier} (IP: ${rawIp}) -> Route: ${request.method} ${request.originalUrl}`);

        // 4. Chave da rota — remove query params para consistência
        const routeKey = `${request.method}:${request.originalUrl.split('?')[0]}`;

        try {
            // 5. Consume global PRIMEIRO — se falhar, não gastamos pontos da rota
            const globalRes = await this.limiter.consume(`global:${userIdentifier}`);

            // 6. Depois route (se existir override) — só consome se o global passou
            let routeRes: RateLimiterRes | null = null;

            if (options) {
                const routeLimiter = this.getRouteLimiter(options);
                routeRes = await routeLimiter.consume(`${routeKey}:${userIdentifier}`);
            }

            // 7. Headers — usa o mais restritivo (pelo tempo até reset)
            const activeRes = routeRes && routeRes.msBeforeNext < globalRes.msBeforeNext
                ? routeRes
                : globalRes;

            const resetTimestamp = Math.floor(Date.now() / 1000) + Math.ceil(activeRes.msBeforeNext / 1000);

            // Standard headers (draft-ietf-httpapi-ratelimit-headers)
            if (routeRes && options) {
                response.setHeader('RateLimit-Limit', `${GLOBAL_RATE_LIMIT_POINTS}, ${options.points}`);
                response.setHeader('RateLimit-Remaining', `${globalRes.remainingPoints}, ${routeRes.remainingPoints}`);
            } else {
                response.setHeader('RateLimit-Limit', GLOBAL_RATE_LIMIT_POINTS);
                response.setHeader('RateLimit-Remaining', globalRes.remainingPoints);
            }
            response.setHeader('RateLimit-Reset', resetTimestamp);
            response.setHeader('RateLimit-Policy', options ? 'route' : 'global');

            return true;
        } catch (error) {
            // Se o erro for do RateLimiter (não tem pontos), lança 429
            if (error?.msBeforeNext !== undefined) {
                const retryAfter = Math.ceil(error.msBeforeNext / 1000);
                const resetTimestamp = Math.floor(Date.now() / 1000) + retryAfter;

                response.setHeader('Retry-After', retryAfter);
                response.setHeader('RateLimit-Remaining', 0);
                response.setHeader('RateLimit-Reset', resetTimestamp);
                response.setHeader('RateLimit-Policy', options ? 'route' : 'global');

                throw new HttpException(
                    {
                        message: ERRORS.RATE_LIMIT_EXCEEDED,
                        code: ERRORS.RATE_LIMIT_EXCEEDED,
                        retryAfter,
                    },
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }

            // Se for erro de Redis, logamos e deixamos passar (fail-open)
            // para não bloquear a app se o Redis falhar
            this.logger.error('RateLimit Redis Error', error?.stack);
            return true;
        }
    }
}
