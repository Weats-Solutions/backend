import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

// Definindo o formato da resposta de sucesso
interface StandardSuccessResponse<T> {
    success: true;
    statusCode: number;
    message: string;
    code?: string;
    data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
    T,
    StandardSuccessResponse<T>
> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<StandardSuccessResponse<T>> {
        const httpContext = context.switchToHttp();
        const response = httpContext.getResponse<Response>();
        const request = httpContext.getRequest();

        return next.handle().pipe(
            map((data) => {
                // Se o retorno já for o objeto de sucesso (ex: ignorar e repassar)
                if (data && data.success === true) {
                    return data;
                }

                // Se o Controller retorna { message: '...' }, extrai o message para fora de data
                let message = 'Requisição bem-sucedida.';
                if (request.method === 'POST') {
                    message = 'Recurso criado com sucesso.';
                }

                if (data && typeof data === 'object' && 'message' in data) {
                    message = (data as any).message;
                }

                // Se o Controller retorna { code: '...' }, extrai o code para fora de data
                const code = data && typeof data === 'object' ? (data as any).code : undefined;

                // Remove 'message' e 'code' de data se existir
                let responseData = data;
                if (
                    data &&
                    typeof data === 'object' &&
                    ('message' in data || 'code' in data)
                ) {
                    const { message: _, code: __, ...rest } = data as any;
                    responseData = rest;
                }

                return {
                    success: true,
                    statusCode: response.statusCode || HttpStatus.OK,
                    message,
                    code,
                    data: responseData !== undefined ? responseData : {},
                } as StandardSuccessResponse<T>;
            }),
        );
    }
}
