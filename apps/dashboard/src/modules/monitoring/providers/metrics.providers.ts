import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

export const httpRequestsTotalProvider = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received by the dashboard API',
  labelNames: ['method', 'route', 'status'],
});

export const httpRequestDurationSecondsProvider = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // detailed latency buckets
});
