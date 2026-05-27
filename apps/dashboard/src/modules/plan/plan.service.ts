import { Injectable } from '@nestjs/common';
import { ERRORS } from '@weats/common';
import { CorePrismaService } from '@weats/database';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class PlanService {
    constructor(private readonly prisma: CorePrismaService) { }

    async getPlans() {
        const plans = await this.prisma.plan.findMany({
            select: {
                id: true,
                name: true,
                planCycles: {
                    select: {
                        id: true,
                        price: true,
                        cycle: true,
                    },
                },
                features: {
                    orderBy: { feature: { position: 'asc' } },
                    where: {
                        feature: {
                            showInPlans: true,
                        }
                    },
                    select: {
                        valueBoolean: true,
                        valueQuantity: true,
                        feature: {
                            select: {
                                name: true,
                                type: true,
                                showInDetailsOnly: true,
                                position: true,
                            },
                        },
                    },
                },
            },
        });

        if (!plans || plans.length === 0) {
            throw new RpcException({
                status: 400,
                message: ERRORS.NO_PLANS,
                code: ERRORS.NO_PLANS,
            });
        }

        // Agrupar por cycle
        const result = plans.map((plan) => {
            const cyclesGrouped = plan.planCycles.reduce(
                (acc, cycle) => {
                    acc[cycle.cycle] = {
                        id: cycle.id,
                        price: Number(cycle.price),
                    };
                    return acc;
                },
                {} as Record<string, { id: string; price: number }>,
            );

            const features = plan.features.map((pf) => ({
                name: pf.feature.name,
                type: pf.feature.type,
                valueBoolean: pf.valueBoolean,
                valueQuantity: pf.valueQuantity,
                position: pf.feature.position,
                showInDetailsOnly: pf.feature.showInDetailsOnly,
            }));

            return {
                id: plan.id,
                name: plan.name,
                cycles: cyclesGrouped,
                features,
            };
        });

        return result;
    }
}
