import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { CreateExpenseDto } from '@weats/contracts';
import { ExpenseService } from './expense.service';

@Controller()
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @MessagePattern(DASHBOARD_PATTERNS.EXPENSE_CREATE)
  async createExpense(
    @Payload() payload: { establishmentId: string; createExpenseDto: CreateExpenseDto },
  ) {
    return this.expenseService.createExpense(
      payload.establishmentId,
      payload.createExpenseDto,
    );
  }

  @MessagePattern(DASHBOARD_PATTERNS.EXPENSE_GET_BY_ESTABLISHMENT)
  async getExpensesByEstablishment(
    @Payload() payload: { establishmentId: string },
  ) {
    return this.expenseService.getExpensesByEstablishment(payload.establishmentId);
  }

  @MessagePattern(DASHBOARD_PATTERNS.EXPENSE_DELETE)
  async deleteExpense(
    @Payload() payload: { id: string; establishmentId: string },
  ) {
    return this.expenseService.deleteExpense(payload.id, payload.establishmentId);
  }
}
