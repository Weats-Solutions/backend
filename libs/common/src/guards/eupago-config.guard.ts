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
 * Guard that validates if the establishment has a valid EuPago configuration.
 * Blocks requests if:
 * - No API key is configured
 * - The integration is disabled
 *
 * Should be applied to all payment generation endpoints.
 */
@Injectable()
export class EupagoConfigGuard implements CanActivate {
  private readonly logger = new Logger(EupagoConfigGuard.name);

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
        'EupagoConfigGuard: Establishment context is missing from request',
      );
      throw new ForbiddenException(
        'Establishment context is required',
      );
    }

    const record = await this.corePrismaService.establishmentIntegrations.findUnique({
      where: { establishmentId: establishment.id },
      select: { eupagoApiKey: true, eupagoEnabled: true },
    });

    // Check if API key exists
    if (!record?.eupagoApiKey) {
      this.logger.warn(
        `EupagoConfigGuard: Establishment ${establishment.id} has no EuPago API key configured`,
      );
      throw new ForbiddenException({
        message: 'EuPago is not configured for this establishment',
        code: ERRORS.INTEGRATION_NOT_CONFIGURED,
      });
    }

    // Check if integration is enabled
    if (!record.eupagoEnabled) {
      this.logger.warn(
        `EupagoConfigGuard: EuPago is disabled for establishment ${establishment.id}`,
      );
      throw new ForbiddenException({
        message: 'EuPago integration is disabled',
        code: ERRORS.INTEGRATION_DISABLED,
      });
    }

    // Attempt to decrypt the key to ensure it's valid
    try {
      this.encryption.decrypt(record.eupagoApiKey);
    } catch (error) {
      this.logger.error(
        `EupagoConfigGuard: Failed to decrypt EuPago API key for establishment ${establishment.id}`,
        error,
      );
      throw new ForbiddenException({
        message: 'EuPago configuration is invalid',
        code: ERRORS.INTEGRATION_CONFIGURATION_INVALID,
      });
    }

    return true;
  }
}
