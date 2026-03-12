import { Catch, ArgumentsHost, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * Global exception filter for microservices.
 * Catches ALL unhandled exceptions and converts them into properly
 * formatted RpcExceptions so the Gateway can translate them into
 * meaningful HTTP responses instead of generic 500 errors.
 */
@Catch()
export class AllRpcExceptionsFilter extends BaseRpcExceptionFilter {
    private readonly logger = new Logger(AllRpcExceptionsFilter.name);

    catch(exception: any, host: ArgumentsHost): Observable<any> {
        // If it's already an RpcException, let it pass through as-is
        if (exception instanceof RpcException) {
            return super.catch(exception, host);
        }

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code: string | undefined;

        // Handle NestJS HttpExceptions (BadRequest, NotFound, etc.)
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const response = exception.getResponse();
            if (typeof response === 'object' && response !== null) {
                message = (response as any).message || exception.message;
                code = (response as any).code;
            } else {
                message = String(response);
            }
        }
        // Handle Prisma errors
        else if (exception?.constructor?.name === 'PrismaClientKnownRequestError') {
            status = HttpStatus.BAD_REQUEST;
            code = exception.code;

            switch (exception.code) {
                case 'P2002':
                    message = `Unique constraint violation on: ${exception.meta?.target?.join(', ') || 'unknown field'}`;
                    break;
                case 'P2003':
                    message = `Foreign key constraint failed on: ${exception.meta?.field_name || 'unknown field'}`;
                    break;
                case 'P2011':
                    message = `Null constraint violation on: ${exception.meta?.constraint || 'required field'}`;
                    break;
                case 'P2025':
                    status = HttpStatus.NOT_FOUND;
                    message = 'Record not found';
                    break;
                default:
                    message = `Database error: ${exception.message}`;
            }
        }
        else if (exception?.constructor?.name === 'PrismaClientValidationError') {
            status = HttpStatus.BAD_REQUEST;
            message = 'Invalid data provided to the database query';
            code = 'PRISMA_VALIDATION';
        }
        // Handle generic JS errors
        else if (exception instanceof Error) {
            message = exception.message || 'Unknown error';
        }

        this.logger.error(
            `[${status}] ${message}`,
            exception?.stack,
        );

        // Wrap everything as a properly formatted RpcException
        const rpcException = new RpcException({
            status,
            message,
            code,
        });

        return throwError(() => rpcException.getError());
    }
}
