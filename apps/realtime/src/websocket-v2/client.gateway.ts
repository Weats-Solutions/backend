import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { createHash } from 'crypto';
import { Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { RealtimeStateService } from './state.service';
import { RealtimeV2ClientAuthService } from './client-auth.service';
import { RealtimeV2DispatchService } from './dispatch.service';
import { RealtimeV2SecurityService } from './security.service';
import {
  ClientCallPayload,
  CallRequestedPayload,
  RealtimeV2ClientServer,
  RealtimeV2SocketData,
  RealtimeV2Error,
  RealtimeStaffCallType,
  RealtimeCallStatus
} from './realtime-v2.types';

@WebSocketGateway({
  namespace: 'realtime-v2-client',
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:4000', 'http://localhost:3000', 'https://*.weats.pro', 'https://table-management.weats.pro'],
    credentials: true
  },
  pingInterval: 15000,
  pingTimeout: 20000,
})
export class RealtimeV2ClientGateway implements OnGatewayInit {
  @WebSocketServer()
  server: RealtimeV2ClientServer;

  private readonly logger = new Logger(RealtimeV2ClientGateway.name);
  private static readonly DISCONNECT_GRACE_MS = 5 * 60 * 1000;

  constructor(
    private readonly rooms: RoomsService,
    private readonly stateService: RealtimeStateService,
    private readonly authService: RealtimeV2ClientAuthService,
    private readonly dispatchService: RealtimeV2DispatchService,
    private readonly securityService: RealtimeV2SecurityService,
  ) { }

  afterInit(server: RealtimeV2ClientServer) {
    this.dispatchService.registerClientServer(server);

    server.use(async (socket: Socket<any, any, any, RealtimeV2SocketData>, next) => {
      try {
        const inSpId = (socket.handshake.auth?.servicePointId
          || socket.handshake.headers['servicepointid']
          || socket.handshake.query?.servicePointId) as string | undefined;

        const qrSessionToken = this.authService.extractQrSessionToken(
          socket.handshake.auth as Record<string, unknown> | undefined,
          socket.handshake.headers['cookie'],
        );

        const cleanSpId = inSpId?.trim();
        const context = qrSessionToken
          ? await this.authService.validateQrSession(qrSessionToken)
          : cleanSpId
            ? await this.authService.validateServicePoint(cleanSpId)
            : null;

        if (!context) {
          const err = qrSessionToken ? RealtimeV2Error.INVALID_QR : cleanSpId ? RealtimeV2Error.INVALID_SP : RealtimeV2Error.MISSING_AUTH;
          return next(new Error(err));
        }

        const clientIp = this.securityService.resolveClientIp(socket);
        const clientId = (socket.handshake.auth?.clientId as string)
          || createHash('md5').update(clientIp).digest('hex').substring(0, 8);

        // --- SECURITY CHECKS ---
        if (await this.securityService.isServicePointBlocked(context.establishmentId, context.servicePointId)) {
          this.logger.warn(`[SECURITY] Ligação REJEITADA - Mesa Bloqueada: ${context.servicePointId} (Est: ${context.establishmentId})`);
          return next(new Error(RealtimeV2Error.SP_BLOCKED));
        }

        if (this.securityService.isClientBlocked(clientIp, clientId)) {
          this.logger.warn(`[SECURITY] Ligação REJEITADA - IP/ID Banido: ${clientIp} / ${clientId}`);
          return next(new Error(RealtimeV2Error.IP_BAN));
        }

        const throttle = this.securityService.evaluateThrottle(clientIp, clientId, false);
        if (!throttle.allowed) {
          return next(new Error(`${RealtimeV2Error.THROTTLE}:${throttle.remaining || 0}`));
        }

        if (!this.securityService.beginConnecting(clientId)) {
          return next(new Error(RealtimeV2Error.CONNECTING_LOCK));
        }

        try {
          const spRoom = this.rooms.servicePoint(context.establishmentId, context.servicePointId);
          const connectedSockets = await server.in(spRoom).fetchSockets();
          const alreadyConnected = connectedSockets.find(s => (s.data as RealtimeV2SocketData).clientId === clientId);

          if (alreadyConnected) {
            return next(new Error(RealtimeV2Error.ALREADY_CONNECTED));
          }

          // Agrupa por clientId único para ignorar reconexões, abas duplicadas ou artefatos de HTTP Polling
          const uniqueClientIds = new Set(
            connectedSockets
              .map(s => (s.data as RealtimeV2SocketData).clientId)
              .filter(Boolean)
          );

          const MARGIN = 0;
          if (uniqueClientIds.size >= context.maxCapacity + MARGIN) {
            this.logger.warn(`[SECURITY] Mesa ${context.servicePointId} excedeu o limite máximo (${context.maxCapacity} + ${MARGIN}). A bloquear a mesa no Redis...`);


            return next(new Error(RealtimeV2Error.CAPACITY_EXCEEDED));
          }

          socket.data.clientId = clientId;
          socket.data.establishmentId = context.establishmentId;
          socket.data.servicePointId = context.servicePointId;
          socket.data.servicePointName = context.servicePointName;
          socket.data.zoneId = context.zoneId;
          socket.data.zoneName = context.zoneName;
          socket.data.maxCapacity = context.maxCapacity;

          return next();
        } finally {
          this.securityService.endConnecting(clientId);
        }
      } catch (error) {
        this.logger.error('Client socket auth failed', error);
        return next(new Error(RealtimeV2Error.INTERNAL_ERROR));
      }
    });
  }

  async handleConnection(socket: Socket<any, any, any, RealtimeV2SocketData>) {
    const estId = socket.data.establishmentId;
    const spId = socket.data.servicePointId;
    const clientId = socket.data.clientId;

    if (!estId || !spId || !clientId) return;

    this.securityService.cancelPendingDisconnectCleanup(
      this.securityService.buildConnectionKey(estId, spId, clientId),
    );

    socket.join(this.rooms.est(estId));
    socket.join(this.rooms.servicePoint(estId, spId));

    const count = (this.server as any).sockets.size;
    this.logger.log(`[CLIENT CONNECT] ✅ Cliente ${clientId} entrou na mesa ${spId} (Est: ${estId}) | Total: ${count}`);

    // Verificar se existe chamada ativa deste cliente no Redis (para reconexões)
    const activeCall = await this.stateService.getActiveCall(estId, spId, clientId);
    if (activeCall) {
      this.logger.log(`[CLIENT CONNECT] 📢 Cliente ${clientId} reconectou com chamada ativa. A enviar estado PENDING...`);
      socket.emit('call:status', {
        status: RealtimeCallStatus.PENDING,
        message: activeCall.message,
        timestamp: activeCall.timestamp,
      });
    }
    // Nota: não emitir nada se não houver chamada — o cliente pode estar a
    // conectar para fazer um pedido novo e o COMPLETED fecharia o modal prematuramente.
  }

  handleDisconnect(socket: Socket<any, any, any, RealtimeV2SocketData>) {
    const estId = socket.data.establishmentId;
    const spId = socket.data.servicePointId;
    const clientId = socket.data.clientId;

    if (!estId || !spId || !clientId) return;

    const count = (this.server as any).sockets.size;
    this.logger.log(`[CLIENT DISCONNECT] ❌ Cliente ${clientId} saiu da mesa ${spId} (Est: ${estId}) | Total: ${count}`);

    const cleanupKey = this.securityService.buildConnectionKey(estId, spId, clientId);
    this.securityService.schedulePendingDisconnectCleanup(
      cleanupKey,
      RealtimeV2ClientGateway.DISCONNECT_GRACE_MS,
      async () => {
        const sockets = await this.dispatchService.fetchClientSocketsInServicePoint(estId, spId);
        const hasReconnected = sockets.some(s => (s.data as RealtimeV2SocketData).clientId === clientId);

        if (hasReconnected) return;

        await this.stateService.removeActiveCall(estId, spId, clientId);
        this.dispatchService.emitCallRemoved(estId, spId, clientId);
      },
    );
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('call:request')
  async handleClientCall(
    @ConnectedSocket() socket: Socket<any, any, any, RealtimeV2SocketData>,
    @MessageBody() payload: ClientCallPayload,
  ) {
    const establishmentId = socket.data.establishmentId;
    const servicePointId = socket.data.servicePointId;
    const clientId = socket.data.clientId;

    if (!establishmentId || !servicePointId || !clientId) {
      return { error: RealtimeV2Error.UNAUTHORIZED };
    }

    if (!this.securityService.beginProcessing(clientId)) {
      return { error: 'REQUEST_OVERLAP', spam: true };
    }

    try {
      if (await this.securityService.isServicePointBlocked(establishmentId, servicePointId)) {
        this.logger.warn(`[SECURITY] Pedido REJEITADO - Mesa Bloqueada: ${servicePointId} (Client: ${clientId})`);
        return { error: RealtimeV2Error.SP_BLOCKED, blocked: true };
      }

      const clientIp = this.securityService.resolveClientIp(socket);
      if (this.securityService.isClientBlocked(clientIp, clientId)) {
        return { error: RealtimeV2Error.IP_BAN, blocked: true };
      }

      const throttle = this.securityService.evaluateThrottle(clientIp, clientId);
      if (!throttle.allowed) {
        return {
          error: throttle.blocked ? RealtimeV2Error.SPAM_PROTECTION : RealtimeV2Error.THROTTLE,
          blocked: throttle.blocked,
          spam: !throttle.blocked,
          remaining: throttle.remaining,
        };
      }

      const callType = payload?.type || RealtimeStaffCallType.HELP;
      const defaultMessageByType: Record<RealtimeStaffCallType, string> = {
        HELP: 'REALTIME_MSG_NEED_HELP',
        BILL: 'REALTIME_MSG_NEED_BILL',
        ORDER: 'REALTIME_MSG_NEED_ORDER',
        CLEAN: 'REALTIME_MSG_NEED_CLEAN',
      };

      const callPayload: CallRequestedPayload = {
        servicePointId,
        establishmentId,
        servicePointName: socket.data.servicePointName,
        zoneId: socket.data.zoneId,
        zoneName: socket.data.zoneName,
        clientId,
        type: callType,
        message: payload?.message || defaultMessageByType[callType],
        timestamp: new Date().toISOString(),
      };

      this.dispatchService.emitCallRequested(establishmentId, callPayload);
      await this.stateService.saveActiveCall(establishmentId, servicePointId, clientId, callPayload);

      return { success: true };
    } finally {
      this.securityService.endProcessing(clientId);
    }
  }

  @SubscribeMessage('call:cancel')
  async handleClientCancel(
    @ConnectedSocket() socket: Socket<any, any, any, RealtimeV2SocketData>,
  ) {
    const establishmentId = socket.data.establishmentId;
    const servicePointId = socket.data.servicePointId;
    const clientId = socket.data.clientId;

    if (!establishmentId || !servicePointId || !clientId) {
      return { error: RealtimeV2Error.UNAUTHORIZED };
    }

    this.securityService.cancelPendingDisconnectCleanup(
      this.securityService.buildConnectionKey(establishmentId, servicePointId, clientId),
    );

    await this.stateService.removeActiveCall(establishmentId, servicePointId, clientId);
    this.dispatchService.emitCallRemoved(establishmentId, servicePointId, clientId);

    return { success: true };
  }
}
