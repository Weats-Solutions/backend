import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  getData() {
    // Simulate fetching data for the dashboard
    return {
      message: 'Hello from the Dashboard Service!',
      timestamp: new Date(),
    };
  }
}
