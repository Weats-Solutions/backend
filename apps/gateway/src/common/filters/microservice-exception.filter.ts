import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RpcException } from '@nestjs/microservices';
import { TimeoutError } from 'rxjs';

@Catch()
export class MicroserviceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MicroserviceExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Log para ver o que está a chegar de facto
    this.logger.error(
      `Exceção capturada: ${JSON.stringify(exception)} | Nome: ${exception?.name} | Constructor: ${exception?.constructor?.name}`,
    );

    // Tratar erros de Timeout do RxJS
    if (
      exception instanceof TimeoutError ||
      exception?.name === 'TimeoutError'
    ) {
      status = HttpStatus.GATEWAY_TIMEOUT;
      message = 'O microserviço demorou demasiado tempo a responder.';
    }
    // Tratar erros de RPC (conexão recusada, etc)
    else if (
      exception?.name === 'RpcException' ||
      exception instanceof RpcException ||
      exception?.code === 'ECONNREFUSED' ||
      exception?.message?.includes('Empty response')
    ) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message =
        'O microserviço de destino não está disponível ou recusou a ligação.';
    }
    // Tratar erros HTTP normais (caso já tenham status)
    else if (exception?.getStatus) {
      status = exception.getStatus();
      message = exception.getResponse()?.message || exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} - Error: ${message}`,
      exception?.stack,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
