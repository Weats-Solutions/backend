import {
    BadRequestException,
    Injectable,
    NotFoundException,
    Logger,
    Inject,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import { CorePrismaService } from '@weats/database';
import { CloudflareService } from '@weats/integrations/cloudflare/cloudflare.service';

@Injectable()
export class ImageService {
    private readonly logger = new Logger(ImageService.name);
    constructor(
        private readonly prismaService: CorePrismaService,
        private readonly cloudflareService: CloudflareService,
        @Inject("CLOUDFLARE_CDN_URL") private readonly cloudflareCdnUrl: string,
    ) { }

    async findImagesByEstablishment(
        establishmentId: string,
        options?: { cursor?: string | null; limit?: number; search?: string },
    ) {
        const limit = options?.limit ?? 18;
        const cursor = options?.cursor ?? null;
        const search = options?.search?.trim() ?? null;
        const maxLimit = Math.min(limit, 50);

        let validCursor: string | null = null;
        if (cursor && cursor !== 'null' && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(cursor)) {
            const cursorExists = await this.prismaService.image.findUnique({
                where: { id: cursor, establishmentId },
                select: { id: true }
            });
            if (cursorExists) {
                validCursor = cursor;
            }
        }

        const whereClause = {
            establishmentId,
            ...(search && { fileName: { contains: search, mode: 'insensitive' as const } })
        };

        try {
            const [images, total] = await Promise.all([
                this.prismaService.image.findMany({
                    where: whereClause,
                    take: maxLimit + 1,
                    ...(validCursor && {
                        cursor: { id: validCursor },
                        skip: 1,
                    }),
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                    select: {
                        id: true,
                        cloudflareImageId: true,
                        fileName: true,
                        url: true,
                        fileSize: true,
                        createdAt: true,
                    },
                }),
                this.prismaService.image.count({
                    where: whereClause,
                }),
            ]);

            let nextCursor: string | null = null;
            if (images.length > maxLimit) {
                const nextItem = images.pop();
                nextCursor = nextItem!.id;
            }
            const result = { images, nextCursor, total };

            return result;
        } catch (err) {
            this.logger.error('Error finding images', err?.stack, 'ImagesService');
            throw new RpcException({
                status: 400,
                message: ERRORS.IMAGE_NOT_FOUND,
                code: ERRORS.IMAGE_NOT_FOUND,
            });
        }
    }

    async updateImageName(imageId: string, establishmentId: string, newFileName: string) {
        const image = await this.prismaService.image.findFirst({
            where: { id: imageId, establishmentId },
        });

        if (!image) {
            throw new RpcException({
                status: 400,
                message: ERRORS.IMAGE_NOT_FOUND,
                code: ERRORS.IMAGE_NOT_FOUND,
            });
        }

        const finalFileName = newFileName.trim();
        if (!finalFileName) {
            throw new RpcException({
                status: 400,
                message: ERRORS.IMAGE_NOT_FOUND,
                code: ERRORS.IMAGE_NOT_FOUND,
            });
        }

        const updated = await this.prismaService.image.update({
            where: { id: imageId },
            data: { fileName: finalFileName },
        });
        return {status: 200, updated };
    }

    async deleteImage(
        imageId: string,
        establishmentId: string,
    ): Promise<{ deleted: { imageId: string } } | { inUse: { imageId: string } }> {
        const image = await this.prismaService.image.findFirst({
            where: { id: imageId, establishmentId },
            select: {
                cloudflareImageId: true,
                id: true,
                item: { select: { id: true }, take: 1 },
                logoUsedInBrands: { select: { id: true }, take: 1 },
                bannerUsedInBrands: { select: { id: true }, take: 1 },
                menuCategory: { select: { id: true }, take: 1 },
            },
        });

        if (!image) {
            throw new RpcException({
                status: 400,
                message: ERRORS.IMAGE_NOT_FOUND,
                code: ERRORS.IMAGE_NOT_FOUND,
            });
        }

        if (
            image?.bannerUsedInBrands?.length > 0 ||
            image?.logoUsedInBrands?.length > 0 ||
            image?.item?.length > 0 ||
            image?.menuCategory?.length > 0
        ) {
            return { inUse: { imageId: image.id } };
        }

        try {
            await this.cloudflareService.deleteImage(image.cloudflareImageId);
            await this.prismaService.image.delete({ where: { id: image.id } });
            return { deleted: { imageId: image.id } };
        } catch (err) {
            this.logger.error(
                `Failed deleting image ${image.id} (Cloudflare or DB)`,
                err?.stack,
                'ImagesService',
            );
            throw new RpcException({
                status: 400,
                message: ERRORS.IMAGE_NOT_FOUND,
                code: ERRORS.IMAGE_NOT_FOUND,
            });
        }
    }

    async deleteImagesIfNotInUse(
        imageIds: string[],
        establishmentId: string,
    ): Promise<{ deleted: string[]; notDeleted: string[]; inUse: string[] }> {
        if (imageIds.length === 0) {
            this.logger.warn('No imageIds provided for deletion', 'ImagesService');
            return { deleted: [], notDeleted: [], inUse: [] };
        }

        const images = await this.prismaService.image.findMany({
            where: { id: { in: imageIds }, establishmentId },
            select: {
                cloudflareImageId: true,
                id: true,
                item: { select: { id: true }, take: 1 },
                logoUsedInBrands: { select: { id: true }, take: 1 },
                bannerUsedInBrands: { select: { id: true }, take: 1 },
                menuCategory: { select: { id: true }, take: 1 },
            },
        });

        const existingIds = new Set(images.map((img) => img.id));
        const notFound = imageIds.filter((id) => !existingIds.has(id));

        if (notFound.length > 0) {
            this.logger.warn(
                'Not found or not belonging to establishment',
                'ImagesService',
            );
        }

        const inUse: string[] = [];
        const deletable: { prismaId: string; cloudflareImageId: string }[] = [];

        for (const img of images) {
            const used =
                img.item.length > 0 ||
                img.logoUsedInBrands.length > 0 ||
                img.bannerUsedInBrands.length > 0 ||
                img.menuCategory.length > 0;
            if (used) {
                inUse.push(img.id);
            } else {
                deletable.push({
                    prismaId: img.id,
                    cloudflareImageId: img.cloudflareImageId,
                });
            }
        }

        const deleted: string[] = [];
        const notDeleted: string[] = [...notFound];
        let completed = 0;

        if (deletable.length > 0) {
            for (const d of deletable) {
                try {
                    await this.cloudflareService.deleteImage(d.cloudflareImageId);
                    try {
                        await this.prismaService.image.delete({
                            where: { id: d.prismaId },
                        });
                    } catch (dbErr) {
                        this.logger.error(
                            `Failed deleting prisma image ${d.prismaId}`,
                            dbErr?.stack,
                            'ImagesService',
                        );
                        notDeleted.push(d.prismaId);
                        continue;
                    }
                    deleted.push(d.prismaId);
                } catch (err) {
                    this.logger.error(
                        `Failed deleting image ${d.prismaId} (Cloudflare or DB)`,
                        err?.stack,
                        'ImagesService',
                    );
                    notDeleted.push(d.prismaId);
                } finally {
                    completed++;
                }
            }
        }

        return { deleted, notDeleted, inUse };
    }

    async confirmDirectUploads(
        images: { id: string; fileName: string; fileSize: number }[],
        establishmentId: string,
    ) {
        if (!images || images.length === 0) return [];

        try {
            const createdImages = await Promise.all(
                images.map((img) =>
                    this.prismaService.image.create({
                        data: {
                            cloudflareImageId: img.id,
                            fileName: img.fileName,
                            url: `${this.cloudflareCdnUrl}/${img.id}`,
                            fileSize: img.fileSize,
                            establishmentId,
                            metadata: {},
                        },
                    }),
                ),
            );

            return { count: images.length, images: createdImages };
        } catch (err) {
            this.logger.error('Error confirming direct uploads', err?.stack, 'ImagesService');
            throw new RpcException({
                status: 400,
                message: ERRORS.IMAGE_NOT_FOUND,
                code: ERRORS.IMAGE_NOT_FOUND,
            });
        }
    }
}
