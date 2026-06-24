import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly counter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    // Skip monitoring endpoints to avoid cluttering metrics
    if (
      req.originalUrl === '/health' ||
      req.originalUrl === '/metrics' ||
      req.originalUrl.includes('/monitoring')
    ) {
      return next.handle();
    }

    const start = process.hrtime();

    return next.handle().pipe(
      tap({
        next: () => this.record(req, res, start),
        error: () => this.record(req, res, start),
      }),
    );
  }

  private record(req: Request, res: Response, start: [number, number]) {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    
    // Normalize route path to group metrics by route template instead of unique IDs
    const route = req.route?.path || req.originalUrl.split('?')[0];
    const method = req.method;
    const status = String(res.statusCode);

    const labels = { method, route, status };

    this.counter.inc(labels);
    this.histogram.observe(labels, duration);
  }
}
