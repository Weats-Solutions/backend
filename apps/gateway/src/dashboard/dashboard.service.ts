import { Inject, Injectable } from '@nestjs/common';
import { DASHBOARD_SERVICE } from '@weats/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_SERVICE) private dashboardService: ClientProxy,
  ) {}

  
  create(createDashboardDto: CreateDashboardDto) {
    return 'This action adds a new dashboard';
  }

  findAll() {
    return `This action returns all dashboard`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dashboard`;
  }

  update(id: number, updateDashboardDto: UpdateDashboardDto) {
    return `This action updates a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }
}
