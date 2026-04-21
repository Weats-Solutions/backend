import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import { CorePrismaService } from '@weats/database';
import { CreateExpenseDto } from '@weats/contracts';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: CorePrismaService) {}

  private parseDocumentDate(value: string | Date): Date {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new RpcException({
          status: 400,
          message: ERRORS.BAD_REQUEST,
          code: ERRORS.BAD_REQUEST,
        });
      }
      return value;
    }

    const isoDate = new Date(value);
    if (!Number.isNaN(isoDate.getTime())) {
      return isoDate;
    }

    if (/^\d{8}$/.test(value)) {
      const year = Number(value.slice(0, 4));
      const month = Number(value.slice(4, 6));
      const day = Number(value.slice(6, 8));
      const parsed = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    throw new RpcException({
      status: 400,
      message: ERRORS.BAD_REQUEST,
      code: ERRORS.BAD_REQUEST,
    });
  }

  async createExpense(establishmentId: string, createExpenseDto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        issuerTaxId: createExpenseDto.issuerTaxId,
        customerTaxId: createExpenseDto.customerTaxId ?? null,
        country: createExpenseDto.country ?? null,
        documentType: createExpenseDto.documentType,
        status: createExpenseDto.status,
  documentDate: this.parseDocumentDate(createExpenseDto.documentDate),
        invoiceNumber: createExpenseDto.invoiceNumber,
        totalAmount: createExpenseDto.totalAmount,
        taxableBase: createExpenseDto.taxableBase,
        taxAmount: createExpenseDto.taxAmount,
        atcud: createExpenseDto.atcud ?? null,
        controlCode: createExpenseDto.controlCode ?? null,
        documentHash: createExpenseDto.documentHash ?? null,
        certificate: createExpenseDto.certificate ?? null,
        rawData: createExpenseDto.rawData ?? undefined,
        establishmentId,
      },
    });
  }

  async getExpensesByEstablishment(establishmentId: string) {
    return this.prisma.expense.findMany({
      where: { establishmentId },
      orderBy: { documentDate: 'desc' },
    });
  }

  async deleteExpense(id: string, establishmentId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, establishmentId },
      select: { id: true },
    });

    if (!expense) {
      throw new RpcException({
        status: 404,
        message: ERRORS.NOT_FOUND,
        code: ERRORS.NOT_FOUND,
      });
    }

    await this.prisma.expense.delete({ where: { id } });
    return { success: true };
  }
}
