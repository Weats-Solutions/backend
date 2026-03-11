import { Controller, Body } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DashboardService } from './dashboard.service';
import { CreateEstablishmentDto } from '@weats/contracts/dashboard/dtos/establishment/create-establishment.dto';
import { UseGuards } from '@nestjs/common';
import { ClerkGuard } from '@weats/common/guards';
import { CurrentUser } from '@weats/common/decorators';
import { User } from '@weats/types';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(ClerkGuard)
  CreateEstablishment(
    @Body() createEstablishmentDto: CreateEstablishmentDto,
    @CurrentUser() user: User,
  ) {
    return this.establishmentService.createEstablishment(
      createEstablishmentDto,
      user,
    );
  }

  @MessagePattern('findAllDashboard')
  findAll() {
    return this.dashboardService.findAll();
  }

  @MessagePattern('findOneDashboard')
  findOne(@Payload() id: number) {
    return this.dashboardService.findOne(id);
  }

  @MessagePattern('updateDashboard')
  update(@Payload() updateDashboardDto: UpdateDashboardDto) {
    return this.dashboardService.update(
      updateDashboardDto.id,
      updateDashboardDto,
    );
  }

  @MessagePattern('removeDashboard')
  remove(@Payload() id: number) {
    return this.dashboardService.remove(id);
  }
}
