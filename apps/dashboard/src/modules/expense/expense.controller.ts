import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiAuthenticated, CurrentEstablishment, FeatureLimitGuard, RequiresFeature } from '@weats/common';
import { CreateExpenseDto } from '@weats/contracts';
import { Establishment, feature } from '@weats/types';
import { ExpenseService } from './expense.service';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Expenses')
@Controller('expenses')
@RequiresFeature(feature.expenses)
@UseGuards(FeatureLimitGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) { }

  @Post()
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Criar uma nova despesa' })
  @ApiCreatedResponse({ description: 'Despesa criada com sucesso' })
  async createExpense(
    @CurrentEstablishment() establishment: Establishment,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expenseService.createExpense(
      establishment.id,
      createExpenseDto,
    );
  }

  @Get()
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Listar todas as despesas do estabelecimento' })
  @ApiOkResponse({ description: 'Lista de despesas obtida com sucesso' })
  async getExpensesByEstablishment(
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.expenseService.getExpensesByEstablishment(establishment.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuthenticated()
  @ApiOperation({ summary: 'Remover uma despesa' })
  @ApiParam({ name: 'id', description: 'ID da despesa a remover' })
  @ApiOkResponse({ description: 'Despesa removida com sucesso' })
  async deleteExpense(
    @Param('id') id: string,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.expenseService.deleteExpense(id, establishment.id);
  }
}
