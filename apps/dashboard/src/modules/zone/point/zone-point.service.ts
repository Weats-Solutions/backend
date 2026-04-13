import {
    Injectable,
} from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { CreateServicePointDto, UpdateServicePointDto } from '@weats/contracts';
import { ERRORS } from '@weats/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ZonePointService {
    constructor(
        private readonly prisma: CorePrismaService,
    ) { }
    async createServicePoint(
        zoneId: string,
        createServicePointDto: CreateServicePointDto,
    ) {
        const minCapacity = createServicePointDto.minCapacity;
        const maxCapacity = createServicePointDto.maxCapacity;

        if (minCapacity > maxCapacity) {
            throw new RpcException({
                message: ERRORS.INVALID_CAPACITY,
                code: 400,
            });
        }

        const servicePoint = await this.prisma.servicePoint.create({
            data: {
                name: createServicePointDto.name,
                type: createServicePointDto.type,
                maxCapacity,
                minCapacity,
                isReservable: createServicePointDto.isReservable,
                isPriority: createServicePointDto.isPriority,
                isActive: createServicePointDto.isActive,
                zoneId,
                x: createServicePointDto.x ?? 0,
                y: createServicePointDto.y ?? 0,
                z: createServicePointDto.z ?? 0,
                rotation: createServicePointDto.rotation ?? 0,
                width: createServicePointDto.width ?? 1,
                height: createServicePointDto.height ?? 1,
                shape: createServicePointDto.shape ?? 'rectangle',
                color: createServicePointDto.color ?? 'gray',
            },
            select: {
                id: true,
                name: true,
                type: true,
                maxCapacity: true,
                minCapacity: true,
                isReservable: true,
                isPriority: true,
                isActive: true,
                x: true,
                y: true,
                z: true,
                rotation: true,
                width: true,
                height: true,
                shape: true,
                color: true,
            },
        });



        return servicePoint;
    }

    async getServicePoints(zoneId: string) {
        const servicePoints = await this.prisma.servicePoint.findMany({
            where: {
                zoneId,
            },
            orderBy: {
                name: 'asc',
            },
        });


        return servicePoints;
    }

    async getServicePointById(
        pointId: string,
        zoneId: string,
    ) {
        const servicePoint = await this.prisma.servicePoint.findFirst({
            where: {
                id: pointId,
                zoneId: zoneId
            }
        });

        if (!servicePoint) {
            throw new RpcException({
                message: ERRORS.NOT_FOUND,
                code: 404,
            });
        }   

        if (servicePoint.zoneId !== zoneId) {
            throw new RpcException({
                message: ERRORS.SERVICE_POINT_WRONG_ZONE,
                code: 403,
            });
        }

        return servicePoint;
    }

    async updateServicePoint(
        pointId: string,
        updateServicePointDto: UpdateServicePointDto,
    ) {
        try {
            if (
                updateServicePointDto.minCapacity !== undefined &&
                updateServicePointDto.maxCapacity !== undefined &&
                updateServicePointDto.minCapacity > updateServicePointDto.maxCapacity
            ) {
                throw new RpcException({
                    message: ERRORS.INVALID_CAPACITY,
                    code: 400,
                });
            }

            const servicePoint = await this.prisma.servicePoint.update({
                where: {
                    id: pointId,
                },
                data: {
                    ...updateServicePointDto,
                },
            });

            return servicePoint;
        } catch (error) {
            throw new RpcException({
                message: ERRORS.SERVICE_POINT_UPDATE_FAILED,
                code: 400,
            });
        }
    }

    async deleteServicePoint(
        pointId: string,
    ) {
        try {
            const deletedPoint = await this.prisma.servicePoint.delete({
                where: {
                    id: pointId,
                },
                select: {
                    id: true,
                },
            });

            return {
                pointId: deletedPoint.id,
            };
        } catch (error) {
            throw new RpcException({
                message: ERRORS.SERVICE_POINT_DELETION_FAILED,
                code: 400,
            });
        }
    }
}
