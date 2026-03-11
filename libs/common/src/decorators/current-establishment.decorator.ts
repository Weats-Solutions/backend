import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Establishment } from '@weats/types';

export const CurrentEstablishment = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.establishment as Establishment;
  },
);
