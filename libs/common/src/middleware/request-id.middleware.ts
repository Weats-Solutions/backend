import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const id =
      req.headers['x-request-id'] ||
      req.headers['x-correlation-id'] ||
      randomUUID();

    // Mutate request headers
    req.headers['x-request-id'] = id;
    req.headers['x-correlation-id'] = id;

    // Mutate response headers so client gets the trace ID
    res.setHeader('x-request-id', id);

    next();
  }
}
