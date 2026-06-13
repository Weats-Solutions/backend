import { Controller, Get, Param, Post, Body, Req, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { RealtimeStateService } from './websocket-v2/state.service';
import { RealtimeV2DispatchService } from './websocket-v2/dispatch.service';
import { RealtimeStaffCallType, RealtimeV2Error, CallRequestedPayload } from './websocket-v2/realtime-v2.types';
import { RealtimeV2SecurityService } from './websocket-v2/security.service';
import { RealtimeV2ClientAuthService } from './websocket-v2/client-auth.service';
import { ClerkGuard, EstablishmentStaffGuard } from '@weats/common';
import { Request } from 'express';

@Controller('realtime-v2')
export class RealtimeV2Controller {
  constructor(
    private readonly stateService: RealtimeStateService,
    private readonly securityService: RealtimeV2SecurityService,
    private readonly dispatchService: RealtimeV2DispatchService,
    private readonly authService: RealtimeV2ClientAuthService,
  ) { }

  private checkSystemAdminSecret(req: Request) {
    const authHeader = req.headers['x-admin-secret'];
    const expectedSecret = process.env.ADMIN_SECRET || 'weats-super-secret-dev-key';
    if (!authHeader || authHeader !== expectedSecret) {
      throw new HttpException('Forbidden: Invalid system admin secret', HttpStatus.FORBIDDEN);
    }
  }

  @Post('call')
  async handleClientCall(
    @Req() req: Request,
    @Body() body: { type: RealtimeStaffCallType; message?: string; servicePointId?: string; clientId?: string },
  ) {
    const sessionToken = this.authService.extractQrSessionToken(
      body as any,
      req.headers['cookie'],
    );

    const context = sessionToken
      ? await this.authService.validateQrSession(sessionToken)
      : body.servicePointId
        ? await this.authService.validateServicePoint(body.servicePointId)
        : null;

    if (!context) {
      let authError: string = RealtimeV2Error.MISSING_AUTH;
      if (sessionToken) {
        authError = RealtimeV2Error.INVALID_QR;
      } else if (body.servicePointId) {
        authError = RealtimeV2Error.INVALID_SP;
      }
      throw new HttpException(authError, HttpStatus.UNAUTHORIZED);
    }

    if (!body.clientId) {
      throw new HttpException('clientId is required', HttpStatus.BAD_REQUEST);
    }
    const clientId = body.clientId;
    const clientIp = this.securityService.resolveClientIp(req);

    if (await this.securityService.isServicePointBlocked(context.establishmentId, context.servicePointId)) {
      throw new HttpException(RealtimeV2Error.SP_BLOCKED, HttpStatus.FORBIDDEN);
    }

    if (this.securityService.isClientBlocked(clientIp, clientId)) {
      throw new HttpException(RealtimeV2Error.IP_BAN, HttpStatus.FORBIDDEN);
    }

    const throttle = this.securityService.evaluateThrottle(clientIp, clientId);
    if (!throttle.allowed) {
      throw new HttpException(
        {
          error: throttle.blocked ? RealtimeV2Error.SPAM_PROTECTION : RealtimeV2Error.THROTTLE,
          blocked: throttle.blocked,
          remaining: throttle.remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const callType = body.type || RealtimeStaffCallType.HELP;
    const defaultMessageByType: Record<RealtimeStaffCallType, string> = {
      HELP: 'REALTIME_MSG_NEED_HELP',
      BILL: 'REALTIME_MSG_NEED_BILL',
      ORDER: 'REALTIME_MSG_NEED_ORDER',
      CLEAN: 'REALTIME_MSG_NEED_CLEAN',
    };

    const callPayload: CallRequestedPayload = {
      servicePointId: context.servicePointId,
      establishmentId: context.establishmentId,
      servicePointName: context.servicePointName,
      zoneId: context.zoneId,
      zoneName: context.zoneName,
      clientId,
      type: callType,
      message: body.message || defaultMessageByType[callType],
      timestamp: new Date().toISOString(),
    };

    this.dispatchService.emitCallRequested(context.establishmentId, callPayload);
    await this.stateService.saveActiveCall(context.establishmentId, context.servicePointId, clientId, callPayload);

    return { success: true };
  }

  @Post('cancel')
  async handleClientCancel(
    @Req() req: Request,
    @Body() body: { servicePointId?: string; clientId?: string },
  ) {
    const sessionToken = this.authService.extractQrSessionToken(
      body as any,
      req.headers['cookie'],
    );

    const context = sessionToken
      ? await this.authService.validateQrSession(sessionToken)
      : body.servicePointId
        ? await this.authService.validateServicePoint(body.servicePointId)
        : null;

    if (!context) {
      throw new HttpException(RealtimeV2Error.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    if (!body.clientId) {
      throw new HttpException('clientId is required', HttpStatus.BAD_REQUEST);
    }
    const clientId = body.clientId;

    const activeCall = await this.stateService.getActiveCall(context.establishmentId, context.servicePointId, clientId);
    if (!activeCall) {
      throw new HttpException(RealtimeV2Error.GRACE_EXPIRED, HttpStatus.BAD_REQUEST);
    }

    const now = Date.now();
    const callTime = new Date(activeCall.timestamp).getTime();

    if (now - callTime > 10000) {
      throw new HttpException(RealtimeV2Error.GRACE_EXPIRED, HttpStatus.BAD_REQUEST);
    }

    await this.stateService.removeActiveCall(context.establishmentId, context.servicePointId, clientId);
    this.dispatchService.emitCallRemoved(context.establishmentId, context.servicePointId, clientId);
    this.securityService.clearThrottle(clientId);

    return { success: true };
  }

  @Get('connections')
  async getConnections(@Req() req: Request) {
    this.checkSystemAdminSecret(req);

    const staffs = await this.dispatchService.getConnectedStaffsInfo();

    return {
      totalStaffs: staffs.length,
      staffs,
    };
  }

  @Get('debug/:establishmentId')
  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  async debugRedis(@Param('establishmentId') estId: string) {
    const calls = await this.stateService.getActiveCalls(estId);
    return {
      establishmentId: estId,
      count: calls.length,
      calls,
    };
  }

  @Get('emergency/unban-all')
  unbanAll(@Req() req: Request) {
    this.checkSystemAdminSecret(req);

    this.securityService.clearAll();
    return { message: '[V2] Banimentos e locks limpos com sucesso.' };
  }

  @Get('ping')
  ping() {
    return { status: 'ok' };
  }
}
