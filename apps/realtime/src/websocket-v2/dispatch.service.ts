import { Injectable, Logger } from '@nestjs/common';
import { RealtimeCallStatus, RealtimeMessageCode } from '@weats/contracts';
import { RoomsService } from '../rooms/rooms.service';
import {
  CallRequestedPayload,
  RealtimeV2ClientServer,
  RealtimeV2StaffServer,
} from './realtime-v2.types';

@Injectable()
export class RealtimeV2DispatchService {
  public staffServer?: RealtimeV2StaffServer;
  public clientServer?: RealtimeV2ClientServer;
  private readonly logger = new Logger(RealtimeV2DispatchService.name);

  constructor(private readonly rooms: RoomsService) { }

  registerStaffServer(server: RealtimeV2StaffServer) {
    this.staffServer = server;
  }

  registerClientServer(server: RealtimeV2ClientServer) {
    this.clientServer = server;
  }

  emitCallRequested(establishmentId: string, payload: CallRequestedPayload) {
    this.staffServer?.to(this.rooms.est(establishmentId)).emit('call:requested', payload);
    this.logger.log(`[V2 DISPATCH] call:requested est=${establishmentId} sp=${payload.servicePointId}`);
  }

  emitCallRemoved(establishmentId: string, servicePointId: string, clientId: string) {
    this.staffServer?.to(this.rooms.est(establishmentId)).emit('call:removed', {
      servicePointId,
      clientId,
    });
    this.logger.log(`[V2 DISPATCH] call:removed est=${establishmentId} sp=${servicePointId}`);
  }

  emitClientStatus(
    establishmentId: string,
    servicePointId: string,
    status: RealtimeCallStatus,
    message: RealtimeMessageCode | string,
    extra: Record<string, unknown> = {},
  ) {
    this.clientServer?.to(this.rooms.servicePoint(establishmentId, servicePointId)).emit('call:status', {
      status,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    });
    this.logger.debug(`[V2 DISPATCH] call:status est=${establishmentId} sp=${servicePointId} status=${status}`);
  }

  async fetchClientSocketsInServicePoint(establishmentId: string, servicePointId: string) {
    if (!this.clientServer) return [];
    return this.clientServer.in(this.rooms.servicePoint(establishmentId, servicePointId)).fetchSockets();
  }

  async fetchClientSocketsInEstablishment(establishmentId: string) {
    if (!this.clientServer) return [];
    return this.clientServer.in(this.rooms.est(establishmentId)).fetchSockets();
  }
}
