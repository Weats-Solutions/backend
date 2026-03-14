// src/common/guards/establishment-staff.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@weats/common/constants';
import { Logger } from '@nestjs/common';
import { CustomRequest } from '@weats/types';
import { ERRORS } from '@weats/common';
import { CorePrismaService } from '@weats/database';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class EstablishmentStaffGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private corePrismaService: CorePrismaService,
  ) { }
  private readonly logger = new Logger(EstablishmentStaffGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CustomRequest>();

    const establishmentId = request.headers['x-establishment-id'] as string;

    if (!establishmentId) {
      this.logger.warn('x-establishment-id header is missing');
      throw new ForbiddenException({
        message: 'x-establishment-id header is required',
        code: ERRORS.ESTABLISHMENT_ID_HEADER_REQUIRED,
      });
    }

    const establishment = await this.corePrismaService.establishment.findUnique(
      {
        where: { id: establishmentId },
        include: {
          establishmentSettings: true,
          owner: true,
          subscription: {
            select: {
              status: true,
            },
          },
        },
      },
    );
    if (
      !establishment ||
      !establishment.establishmentSettings?.primaryLanguage ||
      !establishment.establishmentSettings?.availableLanguages ||
      !establishment.establishmentSettings?.currency ||
      !establishment.establishmentSettings?.timezone
    ) {
      throw new BadRequestException({
        message: 'Establishment not found',
        code: ERRORS.ESTABLISHMENT_NOT_FOUND,
      });
    }

    request.establishment = {
      id: establishment.id,
      ownerId: establishment.ownerId,
      stripeCustomerId: establishment.stripeCustomerId,
      primaryLanguage: establishment.establishmentSettings.primaryLanguage,
      availableLanguages:
        establishment.establishmentSettings.availableLanguages,
      currency: establishment.establishmentSettings.currency,
      timezone: establishment.establishmentSettings.timezone,
    };

    // Recupera os roles exigidos pelo endpoint
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    const user = request.user;
    if (!user) {
      this.logger.warn('User not found in request');
      throw new ForbiddenException({
        message: 'User not authenticated',
        code: ERRORS.USER_NOT_AUTHENTICATED,
      });
    }

    // Permite acesso se o utilizador for o owner do estabelecimento
    if (establishment.ownerId !== user.id) {
      this.logger.warn(
        `User is not owner of establishment: ${establishment.id} and ${user.id} and ${establishment.ownerId}`,
      );
      throw new ForbiddenException({
        message: 'User is not owner of establishment',
        code: ERRORS.ESTABLISHMENT_OWNER_REQUIRED,
      });
    }

    if (establishment.ownerId === user.id) {
      return true;
    }

    // Se não há roles exigidos, só o owner pode acessar
    if (!requiredRoles) {
      this.logger.warn('No roles required and user is not owner');
      throw new ForbiddenException({
        message: 'Access denied',
        code: ERRORS.ACCESS_DENIED,
      });
    }

    // Verifica se o utilizador é funcionário
    const employee = request.employee;
    if (!employee) {
      this.logger.warn('Employee not found in request');
      throw new ForbiddenException({
        message: 'Employee not found or not authorized',
        code: ERRORS.EMPLOYEE_NOT_AUTHORIZED,
      });
    }

    // Permite acesso se o funcionário possuir um dos roles exigidos
    const hasRole = requiredRoles.some((role) => employee.role === role);
    if (!hasRole) {
      this.logger.warn(
        `Employee does not have required role(s): ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException({
        message: 'Insufficient role',
        code: ERRORS.INSUFFICIENT_ROLE,
      });
    }
    return true;
  }
}
