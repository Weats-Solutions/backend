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
  private staffServer?: RealtimeV2StaffServer;
  private clientServer?: RealtimeV2ClientServer;
  private readonly logger = new Logger(RealtimeV2DispatchService.name);
  private readonly activeCalls = new Set<string>();
  private requestedCount = 0;
  private removedCount = 0;
  private statusCount = 0;

  constructor(private readonly rooms: RoomsService) { }

  registerStaffServer(server: RealtimeV2StaffServer) {
    this.staffServer = server;
  }

  registerClientServer(server: RealtimeV2ClientServer) {
    this.clientServer = server;
  }

  emitCallRequested(establishmentId: string, payload: CallRequestedPayload) {
    this.requestedCount += 1;
    this.activeCalls.add(this.getCallKey(establishmentId, payload.servicePointId, payload.clientId));
    this.staffServer?.to(this.rooms.est(establishmentId)).emit('call:requested', payload);
    this.logger.log(
      `[DISPATCH] call:requested est=${establishmentId} sp=${payload.servicePointId} client=${payload.clientId} | active=${this.activeCalls.size} requested=${this.requestedCount} removed=${this.removedCount} status=${this.statusCount}`,
    );
  }

  emitCallRemoved(establishmentId: string, servicePointId: string, clientId: string) {
    this.removedCount += 1;
    this.activeCalls.delete(this.getCallKey(establishmentId, servicePointId, clientId));
    this.staffServer?.to(this.rooms.est(establishmentId)).emit('call:removed', {
      servicePointId,
      clientId,
    });
    this.logger.log(
      `[DISPATCH] call:removed est=${establishmentId} sp=${servicePointId} client=${clientId} | active=${this.activeCalls.size} requested=${this.requestedCount} removed=${this.removedCount} status=${this.statusCount}`,
    );
  }

  emitClientStatus(
    establishmentId: string,
    servicePointId: string,
    status: RealtimeCallStatus,
    message: RealtimeMessageCode | string,
    extra: Record<string, unknown> = {},
  ) {
    this.statusCount += 1;
    this.clientServer?.to(this.rooms.servicePoint(establishmentId, servicePointId)).emit('call:status', {
      status,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    });
    this.logger.log(
      `[DISPATCH] call:status est=${establishmentId} sp=${servicePointId} status=${status} | active=${this.activeCalls.size} requested=${this.requestedCount} removed=${this.removedCount} statusEvents=${this.statusCount}`,
    );
  }

  async fetchClientSocketsInServicePoint(establishmentId: string, servicePointId: string) {
    if (!this.clientServer) {
      return [];
    }
    return this.clientServer.in(this.rooms.servicePoint(establishmentId, servicePointId)).fetchSockets();
  }

  async fetchClientSocketsInEstablishment(establishmentId: string) {
    if (!this.clientServer) {
      return [];
    }
    return this.clientServer.in(this.rooms.est(establishmentId)).fetchSockets();
  }

  private getCallKey(establishmentId: string, servicePointId: string, clientId: string) {
    return `${establishmentId}:${servicePointId}:${clientId}`;
  }
}
