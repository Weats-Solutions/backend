import { Injectable } from '@nestjs/common';
import { RealtimeMessageCode } from '@weats/contracts';
import { RealtimeStateService } from './state.service';

interface ThrottleResult {
  allowed: boolean;
  blocked: boolean;
  error?: RealtimeMessageCode;
  remaining?: number;
}

@Injectable()
export class RealtimeV2SecurityService {
  private readonly lastCallTimestamps = new Map<string, number>();
  private readonly blockedIPs = new Map<string, number>();
  private readonly ipStrikes = new Map<string, number>();
  private readonly blockedClientIds = new Map<string, number>();
  private readonly processingClients = new Set<string>();
  private readonly connectingClients = new Set<string>();
  private readonly pendingDisconnectCleanup = new Map<string, NodeJS.Timeout>();

  constructor(private readonly stateService: RealtimeStateService) { }

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

  evaluateThrottle(clientIp: string, clientId: string, increment = true, throttleMs = 60000): ThrottleResult {
    const now = Date.now();
    const lastCall = this.lastCallTimestamps.get(clientId);

    if (lastCall && now - lastCall < throttleMs) {
      const remaining = Math.ceil((throttleMs - (now - lastCall)));

      if (increment && clientIp) {
        const strikes = (this.ipStrikes.get(clientIp) || 0) + 1;
        this.ipStrikes.set(clientIp, strikes);

        if (strikes >= 5) {
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

    if (increment) {
      this.ipStrikes.set(clientIp, 0);
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

  resolveClientIp(socket: {
    handshake: {
      headers: Record<string, string | string[] | undefined>;
      address: string;
    };
  }): string {
    const forwardedFor = socket.handshake.headers['x-forwarded-for'];

    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0];
    }

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }

    return socket.handshake.address;
  }
}
