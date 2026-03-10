import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @MessagePattern('dashboard.test')
  getData() {
    return this.dashboardService.getData();
  }
}
