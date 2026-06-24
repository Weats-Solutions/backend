import { Controller, Post, Get, Delete, Patch, Body } from '@nestjs/common';
import { ApiAuthenticated, CurrentEstablishment, Roles } from '@weats/common';
import { Establishment } from '@weats/types';
import { XdRestService } from '@weats/integrations/xd-rest/xd-rest.service';
import { SaveXdRestCredentialsDto } from '@weats/contracts/dashboard/dtos/xd-rest';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Integrations - XD Rest')
@Roles()
@Controller('integrations/xd-rest')
export class XdRestIntegrationController {
    constructor(
        private readonly xdRestService: XdRestService,
    ) { }

    // ─── Status ──────────────────────────────────────────────────────────────

    /**
     * GET /v1/integrations/xd-rest/status
     * Returns the connection status and masked username for the establishment.
     */
    @Get('status')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter estado e utilizador configurado na integração XD Rest' })
    @ApiOkResponse({ description: 'Estado da integração obtido com sucesso' })
    getStatus(@CurrentEstablishment() establishment: Establishment) {
        return this.xdRestService.getStatus(establishment.id);
    }

    // ─── Credentials ─────────────────────────────────────────────────────────

    /**
     * POST /v1/integrations/xd-rest/credentials
     * Saves (or replaces) the XD Rest credentials (base URL, username, password).
     */
    @Post('credentials')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gravar credenciais da XD Rest' })
    @ApiCreatedResponse({ description: 'Credenciais gravadas e validadas com sucesso' })
    saveCredentials(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: SaveXdRestCredentialsDto,
    ) {
        return this.xdRestService.saveCredentials(
            establishment.id,
            dto.baseUrl,
            dto.username,
            dto.password,
        );
    }

    /**
     * DELETE /v1/integrations/xd-rest/credentials
     * Removes the XD Rest credentials and disables the integration.
     */
    @Delete('credentials')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover credenciais da XD Rest' })
    @ApiOkResponse({ description: 'Credenciais removidas com sucesso' })
    deleteCredentials(@CurrentEstablishment() establishment: Establishment) {
        return this.xdRestService.deleteCredentials(establishment.id);
    }

    // ─── Toggle ──────────────────────────────────────────────────────────────

    /**
     * PATCH /v1/integrations/xd-rest/toggle
     * Enables or disables the XD Rest integration without touching credentials.
     */
    @Patch('toggle')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Ativar ou desativar a integração XD Rest' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean', description: 'Ativar/desativar a integração' }
            },
            required: ['enabled']
        }
    })
    @ApiOkResponse({ description: 'Integração alternada com sucesso' })
    toggle(
        @CurrentEstablishment() establishment: Establishment,
        @Body('enabled') enabled: boolean,
    ) {
        return this.xdRestService.toggle(establishment.id, enabled);
    }

    // ─── Test Connection ─────────────────────────────────────────────────────

    /**
     * POST /v1/integrations/xd-rest/test
     * Tests the connection by calling the XD Rest login endpoint with stored credentials.
     */
    @Post('test')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Testar ligação com a API XD Rest' })
    @ApiCreatedResponse({ description: 'Teste de ligação concluído com sucesso' })
    testConnection(@CurrentEstablishment() establishment: Establishment) {
        return this.xdRestService.testConnection(establishment.id);
    }
}
