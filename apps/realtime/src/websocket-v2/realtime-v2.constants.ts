/**
 * Códigos de erro e mensagens do Realtime V2
 * Devem bater certo com as chaves no i18n do frontend (messages/xx/realtime.json)
 */
export const RealtimeV2Error = {
  // Erros de Handshake / Conexão
  THROTTLE: 'REALTIME_ERR_THROTTLE',
  IP_BAN: 'REALTIME_ERR_IP_BAN',
  SP_BLOCKED: 'REALTIME_ERR_SP_BLOCKED',
  INVALID_QR: 'REALTIME_ERR_INVALID_QR',
  INVALID_SP: 'REALTIME_ERR_INVALID_SP',
  CAPACITY_EXCEEDED: 'REALTIME_ERR_CAPACITY_EXCEEDED',
  ALREADY_CONNECTED: 'REALTIME_ERR_ALREADY_CONNECTED',
  
  // Erros de Pedido
  SPAM_PROTECTION: 'REALTIME_ERR_SPAM_PROTECTION',
  UNAUTHORIZED: 'REALTIME_ERR_UNAUTHORIZED',
  MISSING_AUTH: 'REALTIME_ERR_MISSING_AUTH',
  CONNECTING_LOCK: 'REALTIME_ERR_CONNECTING_LOCK',
  INTERNAL_ERROR: 'REALTIME_ERR_INTERNAL_ERROR',
} as const;

export type RealtimeV2Error = typeof RealtimeV2Error[keyof typeof RealtimeV2Error];
