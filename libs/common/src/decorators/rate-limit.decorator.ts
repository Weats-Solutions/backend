import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';
export const RATE_LIMIT_SKIP = 'rate_limit_skip';

export interface RateLimitOptions {
    points: number;
    duration: number; // segundos
}

/**
 * Políticas predefinidas de rate limiting.
 * Alterar aqui afeta todas as rotas que usam essa política — single source of truth.
 *
 * @example
 * @RateLimit('AUTH')        // 5 req / 60s
 * @RateLimit('STRICT')      // 3 req / 60s
 * @RateLimit('MEDIUM')      // 20 req / 60s
 * @RateLimit('RELAXED')     // 100 req / 60s
 * @RateLimit({ points: 500, duration: 10 })  // Override manual para casos especiais
 */
export const RATE_LIMIT_POLICIES = {
    // Ações muito raras e pesadas (processamento, geração de ficheiros, etc.)
    // Ex: gerar QR codes, processar favicon
    STRICT: { points: 5, duration: 60 },

    // Ações de identidade/autenticação — para uso futuro em auth routes
    // Ex: forgot password, OTPs, resend email
    AUTH: { points: 10, duration: 60 },

    // Criação/mutação de recursos normais
    // Ex: criar item, menu, zona, fazer upload
    MEDIUM: { points: 30, duration: 60 },

    // Leitura de dados — listagens, searches, queries
    // Ex: GET /items, GET /menus
    RELAXED: { points: 120, duration: 60 },

    // Webhooks de terceiros (Stripe, Clerk, Eupago)
    // Limite generoso para evitar perder eventos legítimos em bursts
    WEBHOOK: { points: 100, duration: 60 },
} as const satisfies Record<string, RateLimitOptions>;

export type RateLimitPolicy = keyof typeof RATE_LIMIT_POLICIES;

/**
 * Aplica um limite de rate a uma rota ou controller.
 * Aceita uma política predefinida (string) ou opções manuais ({ points, duration }).
 *
 * @example
 * @RateLimit('AUTH')
 * @RateLimit({ points: 500, duration: 30 })
 */
export const RateLimit = (policyOrOptions: RateLimitPolicy | RateLimitOptions) =>
    SetMetadata(RATE_LIMIT_KEY, policyOrOptions);

/**
 * Ignora o rate limit para uma rota ou controller.
 * Útil para healthchecks, webhooks internos, etc.
 *
 * @example
 * @SkipRateLimit()
 */
export const SkipRateLimit = () =>
    SetMetadata(RATE_LIMIT_SKIP, true);
