import { Controller, Post, Get, Delete, Patch, Body, Inject } from '@nestjs/common';
import { CurrentEstablishment, Roles } from '@weats/common';
import { Establishment } from '@weats/types';
import { SaveXdRestCredentialsDto } from '@weats/contracts/dashboard/dtos/xd-rest';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '@weats/common/constants';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';

@Roles()

@Controller('integrations/xd-rest')
export class XdRestIntegrationController {
    constructor(
        @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    ) { }

    // ─── Status ──────────────────────────────────────────────────────────────

    /**
     * GET /v1/integrations/xd-rest/status
     * Returns the connection status and masked username for the establishment.
     */
    @Get('status')
    getStatus(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.XD_REST_GET_STATUS, establishment.id);
    }

    // ─── Credentials ─────────────────────────────────────────────────────────

    /**
     * POST /v1/integrations/xd-rest/credentials
     * Saves (or replaces) the XD Rest credentials (base URL, username, password).
     * Validates by calling the XD Rest login endpoint before storing.
     */
    @Post('credentials')
    saveCredentials(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: SaveXdRestCredentialsDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.XD_REST_SAVE_CREDENTIALS, {
            establishmentId: establishment.id,
            dto,
        });
    }

    /**
     * DELETE /v1/integrations/xd-rest/credentials
     * Removes the XD Rest credentials and disables the integration.
     */
    @Delete('credentials')
    deleteCredentials(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.XD_REST_DELETE_CREDENTIALS, establishment.id);
    }

    // ─── Toggle ──────────────────────────────────────────────────────────────

    /**
     * PATCH /v1/integrations/xd-rest/toggle
     * Enables or disables the XD Rest integration without touching credentials.
     * Body: { enabled: boolean }
     */
    @Patch('toggle')
    toggle(
        @CurrentEstablishment() establishment: Establishment,
        @Body('enabled') enabled: boolean,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.XD_REST_TOGGLE, {
            establishmentId: establishment.id,
            enabled,
        });
    }

    // ─── Test Connection ─────────────────────────────────────────────────────

    /**
     * POST /v1/integrations/xd-rest/test
     * Tests the connection by calling the XD Rest login endpoint with stored credentials.
     */
    @Post('test')
    testConnection(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.XD_REST_TEST_CONNECTION, establishment.id);
    }
}
