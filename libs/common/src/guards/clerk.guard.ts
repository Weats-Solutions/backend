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

@Injectable()
export class ClerkGuard implements CanActivate {
  private readonly logger = new Logger(ClerkGuard.name);

  constructor(private readonly clerkService: ClerkService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
