import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '@weats/common';
import { CurrentEstablishment } from '@weats/common/decorators/current-establishment.decorator';
import { ClerkGuard } from '@weats/common/guards/clerk.guard';
import { EstablishmentStaffGuard } from '@weats/common/guards/establishment-staff.guard';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { CreateExpenseDto } from '@weats/contracts';
import { Establishment } from '@weats/types';

@Controller('expenses')

export class ExpenseController {
  constructor(
    @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
  ) { }

  @Post()
  createExpense(
    @CurrentEstablishment() establishment: Establishment,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.EXPENSE_CREATE, {
      establishmentId: establishment.id,
      createExpenseDto,
    });
  }

  @Get()
  getExpenses(@CurrentEstablishment() establishment: Establishment) {
    return this.dashboardClient.send(
      DASHBOARD_PATTERNS.EXPENSE_GET_BY_ESTABLISHMENT,
      {
        establishmentId: establishment.id,
      },
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExpense(
    @CurrentEstablishment() establishment: Establishment,
    @Param('id') id: string,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.EXPENSE_DELETE, {
      id,
      establishmentId: establishment.id,
    });
  }
}
