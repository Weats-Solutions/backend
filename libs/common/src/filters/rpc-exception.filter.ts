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
        // Deep extract properties to prevent object nesting caused by RpcException
        const rawMessage = exception?.message || exception?.error?.message || exception?.name || 'Internal server error';
        
        let message = typeof rawMessage === 'object' && rawMessage !== null 
            ? rawMessage.message || JSON.stringify(rawMessage) 
            : rawMessage;

        let status = exception?.status || exception?.statusCode || exception?.error?.status || (typeof rawMessage === 'object' ? rawMessage.status : null) || HttpStatus.INTERNAL_SERVER_ERROR;
        
        let code = exception?.code || exception?.error?.code || (typeof rawMessage === 'object' ? rawMessage.code : null) || 'UNKNOWN_ERROR';

        if (exception?.response) {
            status = exception.response.status || exception.response.statusCode || status;
            message = exception.response.message || message;
            code = exception.response.code || code;
        }

        // Handle Prisma errors
        if (exception?.constructor?.name === 'PrismaClientKnownRequestError') {
            status = HttpStatus.BAD_REQUEST;
            code = exception.code;
            switch (exception.code) {
                case 'P2025':
                    status = HttpStatus.NOT_FOUND;
                    message = 'Record not found';
                    break;
                default:
                    message = `Database error: ${exception.message}`;
            }
        } else if (exception?.constructor?.name === 'PrismaClientValidationError') {
            status = HttpStatus.BAD_REQUEST;
            message = 'Invalid data provided to the database query';
            code = 'PRISMA_VALIDATION';
        }

        this.logger.error(`[${status}] ${message}`, exception?.stack);

        // Wrap everything as a properly formatted object
        const payload = {
            error: { status, message, code },
            isWeatsError: true
        };
        
        return throwError(() => payload);
    }
}
