import { Controller, Get, Param } from '@nestjs/common';
import { RealtimeGateway } from './websocket/realtime.gateway';
import { RealtimeStateService } from './websocket/state.service';

@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly stateService: RealtimeStateService,
  ) { }

  @Get('debug/:establishmentId')
  async debugRedis(@Param('establishmentId') estId: string) {
    const calls = await this.stateService.getActiveCalls(estId);
    return {
      establishmentId: estId,
      count: calls.length,
      calls
    };
  }

  @Get('emergency/unban-all')
  unbanAll() {
    this.gateway.clearAllBans();
    return { message: 'Todos os banimentos foram limpos com sucesso.' };
  }

  @Get('ping')
  ping() {
    return { status: 'ok' };
  }
}
