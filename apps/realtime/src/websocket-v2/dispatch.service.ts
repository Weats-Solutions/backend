import { Injectable, Logger } from '@nestjs/common';
import { RealtimeCallStatus, RealtimeMessageCode } from '@weats/contracts';
import { RoomsService } from '../rooms/rooms.service';
import {
  CallRequestedPayload,
  RealtimeV2StaffServer,
  RealtimeV2SocketData,
} from './realtime-v2.types';

@Injectable()
export class RealtimeV2DispatchService {
  private staffServer?: RealtimeV2StaffServer;
  private readonly logger = new Logger(RealtimeV2DispatchService.name);

  constructor(private readonly rooms: RoomsService) { }

  registerStaffServer(server: RealtimeV2StaffServer) {
    this.staffServer = server;
  }

  emitCallRequested(establishmentId: string, payload: CallRequestedPayload) {
    this.staffServer?.to(this.rooms.est(establishmentId)).emit('call:requested', payload);
    this.logger.log(`[V2 DISPATCH] call:requested est=${establishmentId} sp=${payload.servicePointId}`);
  }

  emitCallRemoved(establishmentId: string, servicePointId: string, clientId?: string) {
    this.staffServer?.to(this.rooms.est(establishmentId)).emit('call:removed', {
      servicePointId,
      clientId,
    });
    this.logger.log(`[V2 DISPATCH] call:removed est=${establishmentId} sp=${servicePointId}${clientId ? ` client=${clientId}` : ''}`);
  }

  emitTableStatus(
    establishmentId: string,
    servicePointId: string,
    status: RealtimeCallStatus,
    expiresAt?: string
  ) {
    this.staffServer?.to(this.rooms.est(establishmentId)).emit('table:status', {
      servicePointId,
      status,
      expiresAt
    });
    this.logger.log(`[V2 DISPATCH] table:status est=${establishmentId} sp=${servicePointId} status=${status}${expiresAt ? ` expires=${expiresAt}` : ''}`);
  }

  // Métodos encapsulados para consulta de conexões de forma segura (Desacoplado de Socket.io)

  async getConnectedStaffsInfo() {
    if (!this.staffServer) return [];
    const sockets = await this.staffServer.fetchSockets();
    return sockets.map(s => {
      const d = s.data as RealtimeV2SocketData;
      return {
        id: s.id,
        email: d.user?.email,
        establishmentId: d.establishmentId,
        connectedAt: s.handshake.issued,
      };
    });
  }
}
