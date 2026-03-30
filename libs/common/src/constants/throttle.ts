import { ThrottlerModuleOptions } from '@nestjs/throttler';


//THROTTLE
export const THROTTLE_LIMITS = {
  DEFAULT: {
    name: 'default',
    ttl: 60000, // 1 minuto em ms
    limit: 100,
  },

  STRICT: {
    name: 'strict',
    ttl: 60000, // 1 minuto em ms
    limit: 10,
  },

  VERY_STRICT: {
    name: 'very-strict',
    ttl: 60000, // 1 minuto em ms
    limit: 5,
  },

  LENIENT: {
    name: 'lenient',
    ttl: 60000, // 1 minuto em ms
    limit: 200,
  },

  PUBLIC: {
    name: 'public',
    ttl: 60000, // 1 minuto em ms
    limit: 50,
  },

  READ: {
    name: 'read',
    ttl: 60000, // 1 minuto em ms
    limit: 200,
  },

  WRITE: {
    name: 'write',
    ttl: 60000, // 1 minuto em ms
    limit: 50,
  },

  UPLOAD: {
    name: 'upload',
    ttl: 600000, // 10 minutos em ms
    limit: 20,
  },

  JOBS: {
    name: 'jobs',
    ttl: 60000, // 1 minuto em ms
    limit: 100,
  },
  BOTS: {
    name: 'bots',
    ttl: 60000, // 1 minuto em ms
    limit: 15,
  },
} as const;

export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    THROTTLE_LIMITS.STRICT, // Como limite global padrão, usamos o Strict para todos
    THROTTLE_LIMITS.BOTS,   // E o limite de bots em paralelo
  ],
  ignoreUserAgents: [/^kube-probe/i, /^HealthCheck/i],
  skipIf: () => process.env.NODE_ENV === 'test',
};

export const THROTTLE_ERROR_MESSAGES = {
  DEFAULT: 'Muitas requisições. Por favor, tente novamente mais tarde.',
  AUTH: 'Muitas tentativas de autenticação. Por favor, aguarde antes de tentar novamente.',
  UPLOAD:
    'Limite de uploads excedido. Por favor, aguarde antes de fazer novos uploads.',
  WEBHOOK: 'Limite de chamadas de webhook excedido.',
} as const;

