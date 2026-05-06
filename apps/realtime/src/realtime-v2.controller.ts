import { Controller, Get, Param } from '@nestjs/common';
import { RealtimeStateService } from './websocket-v2/state.service';
import { RealtimeV2DispatchService } from './websocket-v2/dispatch.service';
import { RealtimeV2SocketData } from './websocket-v2/realtime-v2.types';
import { RealtimeV2SecurityService } from './websocket-v2/security.service';

@Controller('realtime-v2')
export class RealtimeV2Controller {
  constructor(
    private readonly stateService: RealtimeStateService,
    private readonly securityService: RealtimeV2SecurityService,
    private readonly dispatchService: RealtimeV2DispatchService,
  ) { }

  @Get('connections')
  async getConnections() {
    const clients: any[] = [];
    const staffs: any[] = [];

    if (this.dispatchService.clientServer) {
      const clientSockets = await this.dispatchService.clientServer.fetchSockets();
      clientSockets.forEach(s => {
        const d = s.data as RealtimeV2SocketData;
        clients.push({
          id: s.id,
          clientId: d.clientId,
          establishmentId: d.establishmentId,
          servicePointId: d.servicePointId,
          connectedAt: s.handshake.issued,
        });
      });
    }

    if (this.dispatchService.staffServer) {
      const staffSockets = await this.dispatchService.staffServer.fetchSockets();
      staffSockets.forEach(s => {
        const d = s.data as RealtimeV2SocketData;
        staffs.push({
          id: s.id,
          email: d.user?.email,
          establishmentId: d.establishmentId,
          connectedAt: s.handshake.issued,
        });
      });
    }

    return {
      totalClients: clients.length,
      totalStaffs: staffs.length,
      clients,
      staffs,
    };
  }

  @Get('debug/:establishmentId')
  async debugRedis(@Param('establishmentId') estId: string) {
    const calls = await this.stateService.getActiveCalls(estId);
    return {
      establishmentId: estId,
      count: calls.length,
      calls,
    };
  }

  @Get('emergency/unban-all')
  unbanAll() {
    this.securityService.clearAll();
    return { message: '[V2] Banimentos e locks limpos com sucesso.' };
  }

  @Get('ping')
  ping() {
    return { status: 'ok' };
  }
}
