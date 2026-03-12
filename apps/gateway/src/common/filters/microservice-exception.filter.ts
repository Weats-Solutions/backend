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
    let message: string | string[] = 'Internal server error';
    let errorName = 'InternalServerError';
    let code: string | undefined;

    // Tratar erros de Timeout do RxJS
    if (
      exception instanceof TimeoutError ||
      exception?.name === 'TimeoutError'
    ) {
      status = HttpStatus.GATEWAY_TIMEOUT;
      message = 'O microserviço demorou demasiado tempo a responder.';
      errorName = 'TimeoutError';
    }
    // Tratar erros vindos de um RpcException no microserviço
    else if (exception?.name === 'RpcException' || exception instanceof RpcException) {
      const errorContent = exception instanceof RpcException ? exception.getError() : exception.message;
      errorName = 'RpcException';

      if (typeof errorContent === 'object' && errorContent !== null) {
        status = (errorContent as any).status || (errorContent as any).statusCode || HttpStatus.BAD_REQUEST;
        message = (errorContent as any).message || 'Erro no microserviço';
        code = (errorContent as any).code;
      } else if (typeof errorContent === 'string') {
        status = HttpStatus.BAD_REQUEST;
        message = errorContent;
      }
    }
    // Tratar erros de RPC de conexão (conexão recusada, etc)
    else if (
      exception?.code === 'ECONNREFUSED' ||
      exception?.message?.includes('Empty response')
    ) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message =
        'O microserviço de destino não está disponível ou recusou a ligação.';
      errorName = 'ServiceUnavailable';
    }
    // Tratar objetos simples vindos do TCP (RpcException serializada)
    else if (
      typeof exception === 'object' &&
      exception !== null &&
      !(exception instanceof Error) &&
      ('status' in exception || 'statusCode' in exception) &&
      'message' in exception
    ) {
      status = exception.status || exception.statusCode || HttpStatus.BAD_REQUEST;
      message = exception.message || 'Erro no microserviço';
      code = exception.code;
      errorName = 'MicroserviceError';
    }
    // Tratar erros HTTP normais (caso já tenham status)
    else if (exception?.getStatus) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      message = exceptionResponse?.message || exceptionResponse || exception.message;
      code = exceptionResponse?.code;
      errorName = exception.name || 'HttpException';
    } else if (exception?.response) {
      status = exception.status || HttpStatus.BAD_REQUEST;
      message = exception.response?.message || exception.response || exception.message;
      code = exception.response?.code;
      errorName = exception.name || 'HttpException';
    } else if (exception instanceof Error) {
      message = exception.message || 'Erro desconhecido';
      errorName = exception.name || 'UnknownError';
    }

    // Normalizar a string da mensagem
    let finalMessage = message;
    if (Array.isArray(message)) {
      finalMessage = message.join(', ');
    } else if (typeof message === 'object') {
      finalMessage = JSON.stringify(message);
    }

    this.logger.error(
      `[${status}] ${request.method} ${request.url} - ${errorName}: ${finalMessage}`,
      exception?.stack,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      errorType: errorName,
      message: finalMessage,
      code,
      timestamp: new Date().toISOString(),
    });
  }
}
