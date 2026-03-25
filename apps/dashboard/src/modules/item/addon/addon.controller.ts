import { Controller } from '@nestjs/common';
import { AddonService } from './addon.service';
import { CreateAddonDto, UpdateAddonDto } from '@weats/contracts';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Establishment } from '@weats/types';
import { DASHBOARD_PATTERNS } from '@weats/common';

@Controller()
export class AddonController {
    constructor(private readonly addonService: AddonService) { }

    @MessagePattern(DASHBOARD_PATTERNS.ADDON_CREATE)
    create(
        @Payload() payload: { establishment: Establishment; createAddonDto: CreateAddonDto }
    ) {
        return this.addonService.create(payload.establishment, payload.createAddonDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ADDON_EDIT)
    edit(
        @Payload() payload: {
            establishmentId: string;
            addonId: string;
            updateAddonDto: UpdateAddonDto;
        }
    ) {
        return this.addonService.edit(payload.establishmentId, payload.addonId, payload.updateAddonDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ADDON_GET_BY_ESTABLISHMENT)
    findAddonsByEstablishment(@Payload() payload: { establishmentId: string }) {
        return this.addonService.findAddonsByEstablishment(payload.establishmentId);
    }
}
