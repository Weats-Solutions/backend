import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { RealtimeStateService } from './state.service';
import { RealtimeV2DispatchService } from './dispatch.service';
import { RealtimeV2SecurityService } from './security.service';
import { RealtimeV2SocketData, RealtimeV2StaffServer, StaffCallResponsePayload, RealtimeCallStatus, RealtimeMessageCode } from './realtime-v2.types';
import { RealtimeV2StaffAuthService } from './staff-auth.service';

@WebSocketGateway({
  namespace: 'realtime-v2-staff',
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:4000', 'http://localhost:3000', 'https://*.weats.app', 'https://table-management.weats.app'],
  credentials: true,
  pingInterval: 15000,
  pingTimeout: 20000,
})
export class RealtimeV2StaffGateway implements OnGatewayInit {
  @WebSocketServer()
  server: RealtimeV2StaffServer;

  private readonly logger = new Logger(RealtimeV2StaffGateway.name);

  constructor(
    private readonly rooms: RoomsService,
    private readonly stateService: RealtimeStateService,
    private readonly authService: RealtimeV2StaffAuthService,
    private readonly dispatchService: RealtimeV2DispatchService,
    private readonly securityService: RealtimeV2SecurityService,
  ) { }

  afterInit(server: RealtimeV2StaffServer) {
    this.dispatchService.registerStaffServer(server);

    server.use(async (socket: Socket<any, any, any, RealtimeV2SocketData>, next) => {
      try {
        const inToken = (socket.handshake.auth?.token
          || socket.handshake.headers['authorization']?.replace('Bearer ', '')
          || socket.handshake.query?.token) as string | undefined;

        const inEstablishmentId = (socket.handshake.auth?.establishmentId
          || socket.handshake.headers['establishmentid']
          || socket.handshake.query?.establishmentId) as string | undefined;

        const token = inToken?.trim();
        const establishmentId = inEstablishmentId?.trim();

        if (!token || !establishmentId) {
          return next(new Error('Missing Staff Authentication'));
        }

        const validation = await this.authService.validate(token, establishmentId);
        if (!validation) {
          return next(new Error('Unauthorized Staff'));
        }

        socket.data.user = validation.user;
        socket.data.role = validation.role;
        socket.data.establishmentId = validation.establishmentId;
        return next();
      } catch (error) {
        this.logger.error('Staff socket auth failed', error);
        return next(new Error('Internal Server Error'));
      }
    });
  }

  async handleConnection(socket: Socket<any, any, any, RealtimeV2SocketData>) {
    const estId = socket.data.establishmentId;
    if (!socket.data.user || !estId) {
      return;
    }

    socket.join(this.rooms.est(estId));
    this.logger.log(`[V2] Staff conectado: ${socket.data.user.email} em ${estId}`);

    const activeCalls = await this.stateService.getActiveCalls(estId);
    socket.emit('call:snapshot', activeCalls);

    const blockedTables = await this.stateService.getBlockedTablesSnapshot(estId);
    socket.emit('table:snapshot', blockedTables);
  }

  handleDisconnect(socket: Socket<any, any, any, RealtimeV2SocketData>) {
    if (socket.data.user && socket.data.establishmentId) {
      this.logger.log(`[V2] Staff ${socket.data.user.id} saiu do estabelecimento ${socket.data.establishmentId}`);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('call:response')
  async handleStaffResponse(
    @ConnectedSocket() socket: Socket<any, any, any, RealtimeV2SocketData>,
    @MessageBody() payload: StaffCallResponsePayload,
  ) {
    const establishmentId = socket.data.establishmentId;
    if (!socket.data.user || !establishmentId) {
      return { error: 'Apenas staff pode responder a chamadas' };
    }

    if (!payload?.servicePointId || !payload?.clientId) {
      return { error: 'servicePointId e clientId são obrigatórios' };
    }

    // 1. Avisar TODOS na mesa que o staff está a caminho
    this.dispatchService.emitClientStatus(
      establishmentId,
      payload.servicePointId,
      RealtimeCallStatus.RESPONDED,
      payload.message || RealtimeMessageCode.STAFF_ON_WAY,
      {
        staffName: socket.data.user.firstName || 'Staff',
      },
    );

    // 2. Limpar TODOS os pedidos desta mesa no Redis
    await this.stateService.removeActiveCall(establishmentId, payload.servicePointId);

    // 3. Avisar todos os KDS para removerem os alertas desta mesa
    this.dispatchService.emitCallRemoved(establishmentId, payload.servicePointId);

    return { success: true };
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('admin:block:sp')
  async handleAdminBlockServicePoint(
    @ConnectedSocket() socket: Socket<any, any, any, RealtimeV2SocketData>,
    @MessageBody('servicePointId') servicePointId: string,
    @MessageBody('durationMinutes') durationMinutes?: number,
  ) {
    const establishmentId = socket.data.establishmentId;
    if (!socket.data.user || !establishmentId) {
      return { error: 'Apenas staff pode bloquear mesas' };
    }

    if (!servicePointId) {
      return { error: 'servicePointId obrigatório' };
    }

    const durationMs = (durationMinutes || 15) * 60 * 1000;
    await this.stateService.saveTableBlock(establishmentId, servicePointId, durationMs);

    const expiresAt = new Date(Date.now() + durationMs).toISOString();
    this.dispatchService.emitTableStatus(
      establishmentId,
      servicePointId,
      RealtimeCallStatus.BLOCKED,
      expiresAt
    );

    return { success: true, expiresAt: new Date(Date.now() + durationMs).toISOString() };
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('admin:block:client')
  async handleAdminBlockClient(
    @ConnectedSocket() socket: Socket<any, any, any, RealtimeV2SocketData>,
    @MessageBody('clientId') clientId: string,
    @MessageBody('durationMinutes') durationMinutes?: number,
  ) {
    const establishmentId = socket.data.establishmentId;
    if (!socket.data.user || !establishmentId) {
      return { error: 'Apenas staff pode bloquear clientes' };
    }

    if (!clientId) {
      return { error: 'clientId obrigatório' };
    }

    const durationMs = (durationMinutes || 60) * 60 * 1000;
    this.securityService.blockClientId(clientId, durationMs);

    const sockets = await this.dispatchService.fetchClientSocketsInEstablishment(establishmentId);
    sockets.forEach(s => {
      if ((s.data as RealtimeV2SocketData).clientId !== clientId) {
        return;
      }

      const servicePointId = (s.data as RealtimeV2SocketData).servicePointId;
      const clientIp = this.securityService.resolveClientIp(s);
      this.securityService.blockIp(clientIp, durationMs);

      s.disconnect(true);
    });

    return { success: true, expiresAt: new Date(Date.now() + durationMs).toISOString() };
  }
}
