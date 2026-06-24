import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ERRORS } from '@weats/common';
import { ClerkService } from '@weats/integrations';
import { User } from '@weats/types';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ClerkGuard implements CanActivate {
  private readonly logger = new Logger(ClerkGuard.name);

  constructor(
    private readonly clerkService: ClerkService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    try {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException({
          message: 'No authorization header provided',
          code: ERRORS.CLERK_AUTH_FAILED,
        });
      }

      const token = this.clerkService.extractTokenFromHeader(authHeader);

      if (!token) {
        throw new UnauthorizedException({
          message: 'No token provided',
          code: ERRORS.CLERK_AUTH_FAILED,
        });
      }

      const user = await this.clerkService.verifyJwtToken(token);

      (request as Request & { user: User }).user = user;

      // Inject the authenticated userId into the Pino request logger context
      if ((request as any).log) {
        (request as any).log = (request as any).log.child({ userId: user.id });
      }

      return true;
    } catch (error) {
      this.logger.error('Authentication failed:', error.message);
      throw new UnauthorizedException({
        message: 'Authentication failed',
        code: ERRORS.CLERK_AUTH_FAILED,
      });
    }
  }
}
