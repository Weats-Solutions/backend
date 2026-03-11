import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '../constants';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DASHBOARD_SERVICE) private dashboardService: ClientProxy,
  ) {}
  findAll() {
    return this.dashboardService.send('dashboard.test', {});
  }
}
