import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUES } from '@weats/bull';
import {
  QrGeneratorService,
  QrStyleConfig,
  ServicePointInput,
  ServicePointQrInput,
} from '@weats/common/qr/qr-generator.service';
import { EmailProducer } from '@weats/bull/producers/email.producer';
import { EmailTemplate } from '@weats/types';
import { GenerateQrCodesDto } from '@weats/contracts';
import { CorePrismaService, QrCodeType } from '@weats/database';
import { CloudflareR2Service } from '@weats/integrations/cloudflare/cloudflare-r2.service';
import crypto from 'crypto';

@Processor(QUEUES.QRCODE)
export class QrCodeProcessor {
  private readonly logger = new Logger(QrCodeProcessor.name);

  constructor(
    private readonly qrGenerator: QrGeneratorService,
    private readonly emailProducer: EmailProducer,
    private readonly prisma: CorePrismaService,
    private readonly cloudflareR2Service: CloudflareR2Service,
    @Inject('CATALOG_URL') private readonly catalogUrl: string,
  ) {}

  private async resolveLogoDataUri(
    establishmentId: string,
    imageId?: string,
  ): Promise<string> {
    if (!imageId) return '';

    const image = await this.prisma.image.findFirst({
      where: { id: imageId, establishmentId },
      select: { cloudflareImageId: true },
    });

    if (!image?.cloudflareImageId) {
      throw new Error(
        `Image not found for QR logo: imageId=${imageId}, establishmentId=${establishmentId}`,
      );
    }

    return this.cloudflareR2Service.getFileDataUri(image.cloudflareImageId);
  }

  @Process('generate-batch')
  async handleGenerateBatch(
    job: Job<{
      dto: GenerateQrCodesDto;
      establishmentId: string;
      establishmentName: string;
      userEmail: string;
      recipientEmail: string;
      points: ServicePointInput[];
    }>,
  ) {
    const { dto, establishmentId, establishmentName, userEmail, recipientEmail, points } =
      job.data;
    this.logger.log(
      `Processing QR Code batch job ${job.id} for ${establishmentId}`,
    );

    try {
      const logoDataUri = await this.resolveLogoDataUri(
        establishmentId,
        dto.imageId,
      );

      // 2. Build QR config
      const config: QrStyleConfig = {
        dotColor: dto.dotColor,
        bgColor: dto.bgColor,
        errorLevel: dto.errorLevel,
        frameId: dto.frameId,
        frameColor: dto.frameColor,
        frameText: dto.frameText,
        frameTextColor: dto.frameTextColor,
        logoBase64: logoDataUri,
      };

      const persistedConfig = {
        dotColor: dto.dotColor,
        bgColor: dto.bgColor,
        errorLevel: dto.errorLevel,
        frameId: dto.frameId,
        frameColor: dto.frameColor,
        frameTextColor: dto.frameTextColor,
      };

      const pointsWithTokens: ServicePointQrInput[] = points.map((point) => ({
        ...point,
        token: crypto.randomBytes(12).toString('base64url'),
        frameText:
          point.isMenuOnly
            ? dto.menuOnlyFrameText
            : dto.useServicePointNameAsFrameText
              ? point.name
              : undefined,
      }));

      // Keep old QR codes untouched and append fresh tokenized records.
      await this.prisma.$transaction(async (tx) => {
        await tx.qrCode.createMany({
          data: pointsWithTokens.map((point) => ({
            token: point.token,
            establishmentId,
            servicePointId: point.isMenuOnly ? null : point.id,
            type: point.isMenuOnly ? QrCodeType.MENU : QrCodeType.TABLE,
            config: {
              ...persistedConfig,
              frameText: point.frameText || dto.frameText,
            },
          })),
        });
      });

      this.logger.log(
        `Persisted ${pointsWithTokens.length} QR token records for ${establishmentId}`,
      );

      const baseUrl = `${this.catalogUrl}/qr/`;

      // 3. Generate batch
      const result = await this.qrGenerator.generateBatch(
        pointsWithTokens,
        config,
        baseUrl,
      );

      // 4. Send email with ZIP
      this.logger.log(`Sending QR Codes email to ${recipientEmail}`);

      // Re-order service zones for context
      const zonesMap = new Map<string, number>();
      points.forEach((p) => {
        zonesMap.set(p.zoneName, (zonesMap.get(p.zoneName) || 0) + 1);
      });
      const serviceZones = Array.from(zonesMap.entries()).map(
        ([zoneName, count]) => ({
          zoneName,
          count,
        }),
      );

      await this.emailProducer.send({
        to: recipientEmail,
        lang: 'pt', // Default to PT for now, could be passed from Gateway
        template: EmailTemplate.QRCODES,
        context: {
          establishmentName,
          qrCodesCount: points.length,
          serviceZones,
        },
        attachments: [
          {
            name: 'qr-codes.zip',
            content: result.zipBuffer.toString('base64'),
            contentType: 'application/zip',
          },
        ],
      });

      this.logger.log(`QR Code batch job ${job.id} completed successfully`);
    } catch (error) {
      const errorStack = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Error processing QR Code batch job ${job.id}:`,
        errorStack,
      );
      throw error;
    }
  }
}
