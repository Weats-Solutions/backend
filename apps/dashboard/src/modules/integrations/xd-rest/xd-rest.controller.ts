import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { Controller } from '@nestjs/common';
import { XdRestService } from '@weats/integrations/xd-rest/xd-rest.service';
import { SaveXdRestCredentialsDto } from '@weats/contracts/dashboard/dtos/xd-rest';

@Controller()
export class XdRestIntegrationController {
    constructor(
        private readonly xdRestService: XdRestService,
    ) { }

    @MessagePattern(DASHBOARD_PATTERNS.XD_REST_GET_STATUS)
    getStatus(@Payload() establishmentId: string) {
        return this.xdRestService.getStatus(establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.XD_REST_SAVE_CREDENTIALS)
    saveCredentials(
        @Payload() payload: { establishmentId: string; dto: SaveXdRestCredentialsDto },
    ) {
        return this.xdRestService.saveCredentials(
            payload.establishmentId,
            payload.dto.baseUrl,
            payload.dto.username,
            payload.dto.password,
        );
    }

    @MessagePattern(DASHBOARD_PATTERNS.XD_REST_DELETE_CREDENTIALS)
    deleteCredentials(@Payload() establishmentId: string) {
        return this.xdRestService.deleteCredentials(establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.XD_REST_TOGGLE)
    toggle(
        @Payload() payload: { establishmentId: string; enabled: boolean },
    ) {
        return this.xdRestService.toggle(payload.establishmentId, payload.enabled);
    }

    @MessagePattern(DASHBOARD_PATTERNS.XD_REST_TEST_CONNECTION)
    testConnection(@Payload() establishmentId: string) {
        return this.xdRestService.testConnection(establishmentId);
    }
}
