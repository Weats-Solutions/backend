import { Injectable } from "@nestjs/common";
import { UpdateAddonDto, CreateAddonDto } from '@weats/contracts';
import { CorePrismaService } from "@weats/database";
import { Establishment } from "@weats/types";

@Injectable()
export class AddonService {
    constructor(private readonly prisma: CorePrismaService) { }

    create(establishment: Establishment, dto: CreateAddonDto) {
        try {
            return this.prisma.addon.create({
                data: {
                    establishmentId: establishment.id,
                    translations: {
                        create: dto.translations,
                    },
                },
                select: {
                    id: true,
                    isGlobal: true,
                    translations: {
                        select: {
                            locale: true,
                            name: true,
                        },
                    },
                },
            });
        } catch (error) {
            console.error("Failed to create addon:", error);
            throw error;
        }
    }

    async edit(establishmentId: string, id: string, dto: UpdateAddonDto) {
        try {
            const addon = await this.prisma.addon.findUnique({
                where: {
                    id,
                    establishmentId,
                },
            });

            if (!addon || addon.establishmentId !== establishmentId) {
                throw new Error('Addon not found');
            }

            if (addon.isGlobal) {
                throw new Error('Addon is global');
            }

            return this.prisma.addon.update({
                where: {
                    id,
                    establishmentId,
                },
                data: {
                    translations: {
                        deleteMany: {
                            addonId: id,
                        },
                        create: dto.translations,
                    },
                },
                select: {
                    id: true,
                    isGlobal: true,
                    translations: {
                        select: {
                            locale: true,
                            name: true,
                        },
                    },
                },
            });
        } catch (error) {
            console.error("Failed to edit addon:", error);
            throw error;
        }
    }

    findGlobal() {
        try {
            return this.prisma.addon.findMany({
                where: {
                    isGlobal: true,
                },
                select: {
                    id: true,
                    isGlobal: true,
                    translations: {
                        select: {
                            locale: true,
                            name: true,
                        },
                    },
                },
            });
        } catch (error) {
            console.error("Failed to find global addons:", error);
            throw error;
        }
    }

    async findAddonsByEstablishment(establishmentId: string) {
        try {
            const globalAddons = await this.findGlobal();
            const establishmentAddons = await this.prisma.addon.findMany({
                where: {
                    establishmentId,
                },
                select: {
                    id: true,
                    isGlobal: true,
                    translations: {
                        select: {
                            locale: true,
                            name: true,
                        },
                    },
                },
            });

            console.log(globalAddons)

            return [...globalAddons, ...establishmentAddons];
        } catch (error) {
            console.error("Failed to find establishment addons:", error);
            throw error;
        }
    }

}
