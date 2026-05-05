import { Controller, Get, Param } from '@nestjs/common';
import { RealtimeStateService } from './websocket/state.service';
import { RealtimeV2SecurityService } from './websocket-v2/security.service';

@Controller('realtime-v2')
export class RealtimeV2Controller {
  constructor(
    private readonly stateService: RealtimeStateService,
    private readonly securityService: RealtimeV2SecurityService,
  ) { }

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
