import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { ERRORS } from '@weats/common';
import { EncryptionService } from '@weats/encryption';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard that validates if the establishment has a valid Ifthenpay configuration.
 * Blocks requests if:
 * - No auth token is configured
 * - The integration is disabled
 *
 * Should be applied to all Ifthenpay payment generation endpoints.
 */
@Injectable()
export class IfthenpayConfigGuard implements CanActivate {
  private readonly logger = new Logger(IfthenpayConfigGuard.name);

  constructor(
    private readonly corePrismaService: CorePrismaService,
    private readonly encryption: EncryptionService,
    private readonly reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const establishment = request.establishment;

    if (!establishment || !establishment.id) {
      this.logger.warn(
        'IfthenpayConfigGuard: Establishment context is missing from request',
      );
      throw new ForbiddenException(
        'Establishment context is required',
      );
    }

    const record = await this.corePrismaService.establishmentIntegrations.findUnique({
      where: { establishmentId: establishment.id },
      select: { ifthenpayAuthToken: true, ifthenpayEnabled: true },
    });

    // Check if API key/token exists
    if (!record?.ifthenpayAuthToken) {
      this.logger.warn(
        `IfthenpayConfigGuard: Establishment ${establishment.id} has no Ifthenpay API key configured`,
      );
      throw new ForbiddenException({
        message: 'Ifthenpay is not configured for this establishment',
        code: ERRORS.INTEGRATION_NOT_CONFIGURED,
      });
    }

    // Check if integration is enabled
    if (!record.ifthenpayEnabled) {
      this.logger.warn(
        `IfthenpayConfigGuard: Ifthenpay is disabled for establishment ${establishment.id}`,
      );
      throw new ForbiddenException({
        message: 'Ifthenpay integration is disabled',
        code: ERRORS.INTEGRATION_DISABLED,
      });
    }

    // Attempt to decrypt the key to ensure it's valid
    try {
      this.encryption.decrypt(record.ifthenpayAuthToken);
    } catch (error) {
      this.logger.error(
        `IfthenpayConfigGuard: Failed to decrypt Ifthenpay API key for establishment ${establishment.id}`,
        error,
      );
      throw new ForbiddenException({
        message: 'Ifthenpay configuration is invalid',
        code: ERRORS.INTEGRATION_CONFIGURATION_INVALID,
      });
    }

    return true;
  }
}
