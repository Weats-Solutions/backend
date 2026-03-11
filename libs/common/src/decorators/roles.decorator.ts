// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { EmployeeRoles } from '@weats/database';
import { ROLES_KEY } from '@weats/common/constants';

export const Roles = (...roles: EmployeeRoles[]) =>
  SetMetadata(ROLES_KEY, roles);
