import { Injectable } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: CorePrismaService) {}

  async getDashboardStats(establishmentId: string) {
    const now = new Date();
    const startOfCurrentMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const startOfNextMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const startOfPreviousMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );

    const [currentExpenses, previousExpenses, itemsCount, bookingsCount, pointsCount] = await Promise.all([
      this.prisma.expense.aggregate({
        where: {
          establishmentId,
          createdAt: {
            gte: startOfCurrentMonth,
            lt: startOfNextMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.expense.aggregate({
        where: {
          establishmentId,
          createdAt: {
            gte: startOfPreviousMonth,
            lt: startOfCurrentMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.item.count({
        where: {
          establishmentId,
          deletedAt: null,
        },
      }),
      this.prisma.booking.count({
        where: {
          establishmentId,
          createdAt: {
            gte: startOfCurrentMonth,
            lt: startOfNextMonth,
          },
        },
      }),
      this.prisma.servicePoint.count({
        where: {
          zone: {
            establishmentId,
          },
          createdAt: {
            gte: startOfCurrentMonth,
            lt: startOfNextMonth,
          },
        },
      }),
    ]);

    const currentTotal = Number(currentExpenses._sum.totalAmount ?? 0);
    const previousTotal = Number(previousExpenses._sum.totalAmount ?? 0);

    let percentChange = 0;
    if (previousTotal === 0) {
      percentChange = currentTotal === 0 ? 0 : 100;
    } else {
      percentChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    }

    return {
      expenses: {
        currentMonthTotal: currentTotal,
        previousMonthTotal: previousTotal,
        percentChange,
      },
      items: {
        count: itemsCount,
      },
      bookings: {
        count: bookingsCount,
      },
      points: {
        count: pointsCount,
      },
    };
  }
}
