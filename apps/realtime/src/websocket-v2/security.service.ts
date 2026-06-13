import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { RealtimeMessageCode } from '@weats/contracts';
import { RealtimeStateService } from './state.service';

interface ThrottleResult {
  allowed: boolean;
  blocked: boolean;
  error?: RealtimeMessageCode;
  remaining?: number;
}

interface StrikeRecord {
  count: number;
  lastStrike: number;
}

@Injectable()
export class RealtimeV2SecurityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeV2SecurityService.name);
  
  private readonly lastCallTimestamps = new Map<string, number>();
  private readonly blockedIPs = new Map<string, number>();
  private readonly ipStrikes = new Map<string, StrikeRecord>();
  private readonly blockedClientIds = new Map<string, number>();
  private readonly processingClients = new Set<string>();
  private readonly connectingClients = new Set<string>();
  private readonly pendingDisconnectCleanup = new Map<string, NodeJS.Timeout>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly stateService: RealtimeStateService) { }

  onModuleInit() {
    // Cleanup periódico a cada minuto para evitar memory leaks
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // 1. Limpar IPs bloqueados expirados
      for (const [ip, expiry] of this.blockedIPs.entries()) {
        if (now >= expiry) {
          this.blockedIPs.delete(ip);
          this.logger.log(`[CLEANUP] Desbloqueado IP por tempo: ${ip}`);
        }
      }

      // 2. Limpar Client IDs bloqueados expirados
      for (const [clientId, expiry] of this.blockedClientIds.entries()) {
        if (now >= expiry) {
          this.blockedClientIds.delete(clientId);
          this.logger.log(`[CLEANUP] Desbloqueado Client ID por tempo: ${clientId}`);
        }
      }

      // 3. Limpar timestamps de chamadas com mais de 5 minutos (excederam o cooldown)
      for (const [clientId, timestamp] of this.lastCallTimestamps.entries()) {
        if (now - timestamp > 300000) {
          this.lastCallTimestamps.delete(clientId);
        }
      }

      // 4. Limpar strikes antigos sem actividade (> 10 minutos)
      for (const [ip, strike] of this.ipStrikes.entries()) {
        if (now - strike.lastStrike > 600000) {
          this.ipStrikes.delete(ip);
        }
      }
    }, 60000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.pendingDisconnectCleanup.forEach(timer => clearTimeout(timer));
    this.pendingDisconnectCleanup.clear();
  }

  buildConnectionKey(estId: string, spId: string, clientId: string) {
    return `${estId}:${spId}:${clientId}`;
  }

  beginConnecting(clientId: string) {
    if (this.connectingClients.has(clientId)) {
      return false;
    }
    this.connectingClients.add(clientId);
    return true;
  }

  endConnecting(clientId: string) {
    this.connectingClients.delete(clientId);
  }

  beginProcessing(clientId: string) {
    if (this.processingClients.has(clientId)) {
      return false;
    }
    this.processingClients.add(clientId);
    return true;
  }

  endProcessing(clientId: string) {
    this.processingClients.delete(clientId);
  }

  async isServicePointBlocked(estId: string, servicePointId: string) {
    return this.stateService.isTableBlocked(estId, servicePointId);
  }

  isClientBlocked(clientIp: string, clientId: string) {
    const ipBanExpiration = this.blockedIPs.get(clientIp);
    const idBanExpiration = this.blockedClientIds.get(clientId);

    return (ipBanExpiration && Date.now() < ipBanExpiration) || (idBanExpiration && Date.now() < idBanExpiration);
  }

  blockClientId(clientId: string, durationMs: number) {
    this.blockedClientIds.set(clientId, Date.now() + durationMs);
  }

  blockIp(clientIp: string, durationMs: number) {
    this.blockedIPs.set(clientIp, Date.now() + durationMs);
  }

  evaluateThrottle(clientIp: string, clientId: string, increment = true): ThrottleResult {
    const now = Date.now();
    const lastCall = this.lastCallTimestamps.get(clientId);

    if (lastCall) {
      const isGrace = now - lastCall < 10000;
      const throttleMs = isGrace ? 10000 : 300000; // 10s em grace, senão 5min (300000ms)

      if (now - lastCall < throttleMs) {
        const remaining = Math.ceil((throttleMs - (now - lastCall)));

        if (increment && clientIp && !isGrace) {
          const strike = this.ipStrikes.get(clientIp);
          const currentCount = strike && (now - strike.lastStrike < 600000) ? strike.count + 1 : 1;
          
          this.ipStrikes.set(clientIp, { count: currentCount, lastStrike: now });

          if (currentCount >= 5) {
            this.blockIp(clientIp, 3600000);
            return {
              allowed: false,
              blocked: true,
              error: RealtimeMessageCode.SPAM_PROTECTION,
            };
          }
        }

        return {
          allowed: false,
          blocked: false,
          error: RealtimeMessageCode.THROTTLE_ERROR,
          remaining,
        };
      }
    }

    if (increment) {
      this.lastCallTimestamps.set(clientId, now);
    }

    return {
      allowed: true,
      blocked: false,
    };
  }

  cancelPendingDisconnectCleanup(key: string) {
    const timer = this.pendingDisconnectCleanup.get(key);
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    this.pendingDisconnectCleanup.delete(key);
  }

  schedulePendingDisconnectCleanup(key: string, delayMs: number, callback: () => Promise<void>) {
    this.cancelPendingDisconnectCleanup(key);

    const timer = setTimeout(() => {
      this.pendingDisconnectCleanup.delete(key);
      void callback();
    }, delayMs);

    this.pendingDisconnectCleanup.set(key, timer);
  }

  clearAll() {
    this.blockedIPs.clear();
    this.blockedClientIds.clear();
    this.ipStrikes.clear();
    this.lastCallTimestamps.clear();
    this.processingClients.clear();
    this.connectingClients.clear();
    this.pendingDisconnectCleanup.forEach(timer => clearTimeout(timer));
    this.pendingDisconnectCleanup.clear();
  }

  clearThrottle(clientId: string) {
    this.lastCallTimestamps.delete(clientId);
  }

  // Resolver IP unificado para Express Request e Socket.io Sockets
  resolveClientIp(reqOrSocket: any): string {
    const headers = reqOrSocket.headers || reqOrSocket.handshake?.headers || {};
    const remoteAddress = reqOrSocket.socket?.remoteAddress || reqOrSocket.handshake?.address || '';
    const forwardedFor = headers['x-forwarded-for'];

    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0];
    }

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }

    return remoteAddress || '';
  }
}
