import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiForbiddenResponse, ApiHeader, ApiUnauthorizedResponse } from "@nestjs/swagger";

export interface ApiAuthenticatedOptions {
    /**
     * Whether the request requires the 'x-establishment-id' header.
     * Defaults to true.
     */
    requireEstablishment?: boolean;
}

export function ApiAuthenticated(options: ApiAuthenticatedOptions = {}) {
    const requireEstablishment = options.requireEstablishment ?? true;

    const decorators = [
        ApiBearerAuth(),
        ApiUnauthorizedResponse({ description: 'Unauthorized' }),
        ApiForbiddenResponse({ description: 'Forbidden' }),
    ];

    if (requireEstablishment) {
        decorators.push(
            ApiHeader({
                name: 'x-establishment-id',
                required: true,
                description: 'ID do estabelecimento',
            })
        );
    }

    return applyDecorators(...decorators);
}