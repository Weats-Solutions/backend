import { Controller, Post, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { RealtimeStateService } from './state.service';
import { RealtimeV2SecurityService } from '../websocket-v2/security.service';
import { RealtimeV2DispatchService } from '../websocket-v2/dispatch.service';
import { ClerkGuard, EstablishmentStaffGuard } from '@weats/common';
import { AdminBlockTablePayload, AdminUnblockTablePayload, RealtimeCallStatus, RealtimeMessageCode } from './realtime-v2.types';

@Controller('v2/admin')
@UseGuards(ClerkGuard, EstablishmentStaffGuard)
export class RealtimeV2AdminController {
  constructor(
    private readonly stateService: RealtimeStateService,
    private readonly securityService: RealtimeV2SecurityService,
    private readonly dispatchService: RealtimeV2DispatchService,
  ) { }

  @Post('block-table')
  @UsePipes(new ValidationPipe({ transform: true }))
  async blockServicePoint(
    @Body() payload: AdminBlockTablePayload,
  ) {
    const durationMs = (payload.durationMinutes || 15) * 60 * 1000;

    // 1. Bloquear no Redis (Persistente)
    await this.stateService.saveTableBlock(payload.establishmentId, payload.servicePointId, durationMs);

    // 2. Notificar todos os KDS (Staff) ligados a este estabelecimento
    const expiresAt = new Date(Date.now() + durationMs).toISOString();
    this.dispatchService.emitTableStatus(
      payload.establishmentId, 
      payload.servicePointId, 
      RealtimeCallStatus.BLOCKED, 
      expiresAt
    );

    return {
      success: true,
      expiresAt
    };
  }

  @Post('unblock-table')
  @UsePipes(new ValidationPipe({ transform: true }))
  async unblockServicePoint(
    @Body() payload: AdminUnblockTablePayload,
  ) {
    // 1. Remover do Redis
    await this.stateService.removeTableBlock(payload.establishmentId, payload.servicePointId);

    // 2. Notificar todos os KDS (Staff) que a mesa está ativa
    this.dispatchService.emitTableStatus(
      payload.establishmentId, 
      payload.servicePointId, 
      RealtimeCallStatus.ACTIVE
    );

    return { success: true };
  }
}
