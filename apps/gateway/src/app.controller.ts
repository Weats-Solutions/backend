import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { OrdersPrismaService } from '@weats/database';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly ordersDb: OrdersPrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-order')
  async createTestOrder(@Body() body: { message: string }) {
    return this.ordersDb.orderTest.create({
      data: {
        message: body.message,
      },
    });
  }

  @Get('test-order')
  async getTestOrders() {
    return this.ordersDb.orderTest.findMany();
  }
}
