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
import { CacheService, dashboardEstKey } from '@weats/cache';
import { SKIP_ESTABLISHMENT_STAFF_KEY } from '../decorators/skip-establishment-staff.decorator';

@Injectable()
export class EstablishmentStaffGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private corePrismaService: CorePrismaService,
    private cache: CacheService,
  ) { }
  private readonly logger = new Logger(EstablishmentStaffGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipEstablishmentStaff = this.reflector.getAllAndOverride<boolean>(
      SKIP_ESTABLISHMENT_STAFF_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipEstablishmentStaff) {
      return true;
    }

    const request = context.switchToHttp().getRequest<CustomRequest>();

    const establishmentId = request.headers['x-establishment-id'] as string;

    if (!establishmentId) {
      this.logger.warn('x-establishment-id header is missing');
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_ID_HEADER_REQUIRED,
      });
    }

    const cacheKey = dashboardEstKey(establishmentId);

    const establishment = await this.cache.wrap(cacheKey, 3600, async () => {
      return this.corePrismaService.establishment.findUnique({
        where: { id: establishmentId },
        include: {
          logoImage: { select: { id: true, url: true } },
          bannerImage: { select: { id: true, url: true } },
          subscription: true,
          schedule: {
            include: { days: { include: { intervals: true } } },
          },
        },
      });
    });
    if (
      !establishment ||
      !establishment.primaryLanguage ||
      !establishment.availableLanguages ||
      !establishment.currency ||
      !establishment.timezone ||
      !establishment.slug
    ) {
      throw new BadRequestException({
        message: ERRORS.ESTABLISHMENT_NOT_FOUND,
      });
    }

    request.establishment = {
      id: establishment.id,
      name: establishment.name,
      ownerId: establishment.ownerId,
      slug: establishment.slug,
      stripeCustomerId: establishment.stripeCustomerId,
      primaryLanguage: establishment.primaryLanguage,
      availableLanguages:
        establishment.availableLanguages,
      currency: establishment.currency,
      timezone: establishment.timezone,
      subscription: establishment.subscription,
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
        message: ERRORS.USER_NOT_AUTHENTICATED,
      });
    }

    // Permite acesso se o utilizador for o owner do estabelecimento
    if (establishment.ownerId !== user.id) {
      this.logger.warn(
        `User is not owner of establishment: ${establishment.id} and ${user.id} and ${establishment.ownerId}`,
      );
      throw new ForbiddenException({
        message: ERRORS.ESTABLISHMENT_OWNER_REQUIRED,
      });
    }

    if (establishment.ownerId === user.id) {
      return true;
    }

    // Se não há roles exigidos, só o owner pode acessar
    if (!requiredRoles) {
      this.logger.warn('No roles required and user is not owner');
      throw new ForbiddenException({
        message: ERRORS.ACCESS_DENIED,
      });
    }

    // Verifica se o utilizador é funcionário
    const employee = request.employee;
    if (!employee) {
      this.logger.warn('Employee not found in request');
      throw new ForbiddenException({
        message: ERRORS.EMPLOYEE_NOT_AUTHORIZED,
      });
    }

    // Permite acesso se o funcionário possuir um dos roles exigidos
    const hasRole = requiredRoles.some((role) => employee.role === role);
    if (!hasRole) {
      this.logger.warn(
        `Employee does not have required role(s): ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException({
        message: ERRORS.INSUFFICIENT_ROLE,
      });
    }
    return true;
  }
}
