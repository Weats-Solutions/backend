import {
    Injectable,
} from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { CreateServiceZoneDto, UpdateServiceZoneDto } from '@weats/contracts';
import { ERRORS, FeatureUsageService } from '@weats/common';
import { Establishment, feature } from '@weats/types';
import { RpcException } from '@nestjs/microservices';


@Injectable()
export class ZoneService {
    constructor(
        private readonly prisma: CorePrismaService,
        private readonly usageService: FeatureUsageService,
    ) { }

    async createServiceZone(
        createServiceZoneDto: CreateServiceZoneDto,
        establishment: Establishment,
    ) {
        try {
            const zone = await this.prisma.serviceZone.create({
                data: {
                    name: createServiceZoneDto.name,
                    isActive: createServiceZoneDto.isActive,
                    establishmentId: establishment.id,
                },
                select: {
                    id: true,
                    name: true,
                    isActive: true,
                    servicePoints: true,
                },
            });
            return zone;
        } catch (error) {
            console.log(error);
            throw new RpcException({
                message: ERRORS.SERVICE_ZONE_CREATION_FAILED,
                code: 400,
            });
        }
    }

    async getServiceZones(establishmentId: string) {
        const zones = await this.prisma.serviceZone.findMany({
            where: {
                establishmentId,
            },
            include: {
                servicePoints: {
                    orderBy: {
                        name: 'asc',
                    },
                },
            },
            orderBy: [
                {
                    position: 'asc',
                },
                {
                    createdAt: 'asc',
                },
            ],
        });

        const { usage, limit } = await this.usageService.getUsageAndLimit(
            feature.points,
            establishmentId,
        );

        const result = {
            usage: {
                current: usage,
                limit: limit,
            },
            zones,
        };


        return result;
    }

    async getServiceZoneById(zoneId: string, establishmentId: string) {
        const zone = await this.prisma.serviceZone.findUnique({
            where: {
                id: zoneId,
                establishmentId,
            },
            include: {
                servicePoints: {
                    orderBy: {
                        name: 'asc',
                    },
                },
            },
        });

        if (!zone) {
            throw new RpcException({
                message: ERRORS.NOT_FOUND,
                code: 404,
            });
        }


        return zone;
    }

    async updateServiceZone(
        zoneId: string,
        dto: UpdateServiceZoneDto,
    ) {

        const zone = await this.prisma.serviceZone.update({
            where: {
                id: zoneId,
            },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.position !== undefined && { position: dto.position }),
            },
            include: {
                servicePoints: true,
            },
        });

        return zone;
    }

    async deleteServiceZone(zoneId: string) {
        const deletedZone = await this.prisma.serviceZone.delete({
            where: {
                id: zoneId,
            },
            select: {
                id: true,
            },
        });


        return { zoneId: deletedZone.id };
    }

}
