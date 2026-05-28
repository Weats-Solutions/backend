import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CorePrismaService } from '@weats/database';
import { ERRORS } from '@weats/common';
import { GenerateQrCodesDto, UpdateQrCodeDto } from '@weats/contracts';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUES } from '@weats/bull';
import { Establishment } from '@weats/types';
import { CacheService } from '@weats/cache';

@Injectable()
export class QrCodesService {
  private readonly logger = new Logger(QrCodesService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    private readonly cache: CacheService,
    @InjectQueue(QUEUES.QRCODE) private readonly qrCodeQueue: Queue,
  ) { }

  async findAll(establishmentId: string) {
    try {
      return this.prisma.qrCode.findMany({
        where: { establishmentId },
        include: {
          servicePoint: {
            select: {
              id: true,
              name: true,
              zone: { select: { name: true } },
            },
          },
          menus: {
            select: {
              id: true,
              translations: {
                select: { name: true, locale: true },
              },
            },
          },
        },
        orderBy: [
          { servicePoint: { name: 'asc' } },
          { createdAt: 'desc' },
        ],
      });
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        message: ERRORS.ACCESS_DENIED,
        code: 500,
      });
    }
  }

  async generateQrCodes(
    dto: GenerateQrCodesDto,
    establishment: Establishment,
    userEmail: string,
  ) {
    const requestedServicePointIds = dto.servicePointIds || [];

    // 1. Verificar se alguma das mesas solicitadas já possui um QR Code associado
    if (requestedServicePointIds.length > 0) {
      const existingQrCodes = await this.prisma.qrCode.findMany({
        where: {
          establishmentId: establishment.id,
          servicePointId: { in: requestedServicePointIds },
        },
        include: {
          servicePoint: { select: { name: true } },
        },
      });

      if (existingQrCodes.length > 0) {
        const tableNames = existingQrCodes
          .map((q) => q.servicePoint?.name)
          .filter(Boolean)
          .join(', ');
        throw new RpcException({
          message: `As seguintes mesas já possuem um Código QR associado: ${tableNames}. Por favor, edite ou remova os existentes em vez de gerar novos.`,
          code: 400,
        });
      }
    }

    // 2. Fetch service points and validate they belong to this establishment
    const servicePoints = requestedServicePointIds.length
      ? await this.prisma.servicePoint.findMany({
        where: {
          id: { in: requestedServicePointIds },
          zone: {
            establishmentId: establishment.id,
          },
        },
        select: {
          id: true,
          name: true,
          zone: {
            select: {
              name: true,
            },
          },
        },
      })
      : [];

    if (servicePoints.length === 0 && !dto.onlyMenu) {
      throw new RpcException({
        message: ERRORS.NOT_FOUND,
        code: 404,
      });
    }

    if (dto.imageId) {
      const image = await this.prisma.image.findFirst({
        where: { id: dto.imageId, establishmentId: establishment.id },
        select: { id: true },
      });

      if (!image) {
        throw new RpcException({
          message: ERRORS.NOT_FOUND,
          code: 404,
        });
      }
    }

    const points = servicePoints.map((sp) => ({
      id: sp.id,
      name: sp.name,
      zoneName: sp.zone.name,
      isMenuOnly: false,
    }));

    if (dto.onlyMenu) {
      points.push({
        id: '',
        name: 'menu_digital',
        zoneName: 'Menu_Digital',
        isMenuOnly: true,
      });
    }

    // 3. Add job to queue
    const job = await this.qrCodeQueue.add('generate-batch', {
      dto,
      establishment,
      userEmail,
      recipientEmail: dto.recipientEmail || userEmail,
      points,
    });

    this.logger.log(
      `Job QRCODE created: ${job.id} for establishment ${establishment.id}`,
    );

    return { jobId: job.id, status: 'queued' };
  }

  async update(
    id: string,
    dto: UpdateQrCodeDto,
    establishment: Establishment,
  ) {
    const qrCode = await this.prisma.qrCode.findFirst({
      where: { id, establishmentId: establishment.id },
    });

    if (!qrCode) {
      throw new RpcException({
        message: ERRORS.NOT_FOUND,
        code: 404,
      });
    }

    const updateData: any = {};
    if (dto.active !== undefined) updateData.active = dto.active;
    if (dto.requireOpenMenus !== undefined) updateData.requireOpenMenus = dto.requireOpenMenus;
    if (dto.menuIds !== undefined) {
      updateData.menus = {
        set: dto.menuIds.map((menuId) => ({ id: menuId })),
      };
    }

    const updatedQrCode = await this.prisma.qrCode.update({
      where: { id },
      data: updateData,
      include: {
        servicePoint: {
          select: { id: true, name: true },
        },
        menus: {
          select: { id: true },
        },
      },
    });

    // Invalida a cache das listas de menus do catálogo
    await this.cache.clearMenuListCache(establishment.slug);

    return updatedQrCode;
  }

  async delete(id: string, establishment: Establishment) {
    const qrCode = await this.prisma.qrCode.findFirst({
      where: { id, establishmentId: establishment.id },
    });

    if (!qrCode) {
      throw new RpcException({
        message: ERRORS.NOT_FOUND,
        code: 404,
      });
    }

    await this.prisma.qrCode.delete({
      where: { id },
    });

    // Invalida a cache das listas de menus do catálogo
    await this.cache.clearMenuListCache(establishment.slug);

    return { success: true };
  }
}
