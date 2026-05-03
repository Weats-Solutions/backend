import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CorePrismaService } from '@weats/database';
import { ERRORS } from '@weats/common';
import { GenerateQrCodesDto } from '@weats/contracts';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUES } from '@weats/bull';
import { Establishment } from '@weats/types';

@Injectable()
export class QrCodesService {
  private readonly logger = new Logger(QrCodesService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    @InjectQueue(QUEUES.QRCODE) private readonly qrCodeQueue: Queue,
  ) {}

  async generateQrCodes(
    dto: GenerateQrCodesDto,
    establishment: Establishment,
    userEmail: string,
  ) {

    // 1. Fetch service points and validate they belong to this establishment
    // Apenas para garantir que os IDs são válidos e pertencem ao establishment
    const requestedServicePointIds = dto.servicePointIds || [];
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

    // 2. Add job to queue
    const job = await this.qrCodeQueue.add('generate-batch', {
      dto,
      establishmentId: establishment.id,
      userEmail,
      recipientEmail: dto.recipientEmail || userEmail,
      points,
    });

    this.logger.log(
      `Job QRCODE created: ${job.id} for establishment ${establishment.id}`,
    );

    return { jobId: job.id, status: 'queued' };
  }
}
