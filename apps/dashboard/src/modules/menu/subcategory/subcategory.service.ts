import { CorePrismaService, MenuType, Prisma } from "@weats/database";
import { Injectable } from "@nestjs/common";
import { CreateCategoryDto, UpdateSubcategoryPositionsDto } from "@weats/contracts";
import { ERRORS } from '@weats/common';
import { Establishment, ITEM_DETAIL_INCLUDE } from "@weats/types";
import { mapTranslatedItemDetailResponse } from "@weats/item-core";
import { RpcException } from "@nestjs/microservices";
import { LinkItemToSubcategoryDto } from "@weats/contracts/dashboard/dtos/item/link-item-to-subcategory.dto";
import { MenuUtilsService } from '@weats/common/utils/modules/menu/menu-utils.service';

@Injectable()
export class MenuSubcategoryService {
    constructor(
        private readonly prisma: CorePrismaService,
        private readonly menuUtilsService: MenuUtilsService,
    ) { }

    private async getEstablishmentSlugByCategoryId(categoryId: string) {
        const category = await this.prisma.menuCategory.findUnique({
            where: { id: categoryId },
            select: { menu: { select: { establishment: { select: { slug: true } } } } },
        });
        return category?.menu?.establishment?.slug;
    }

    private async getEstablishmentSlugBySubcategoryId(subcategoryId: string) {
        const subcategory = await this.prisma.menuSubcategory.findUnique({
            where: { id: subcategoryId },
            select: {
                category: { select: { menu: { select: { establishment: { select: { slug: true } } } } } },
            },
        });
        return subcategory?.category?.menu?.establishment?.slug;
    }


    async listSubcategories(menuId: string, categoryId: string) {
        try {
            const menu = await this.prisma.menu.findUnique({
                where: { id: menuId },
                select: {
                    id: true,
                    translations: true,
                    categories: {
                        where: { id: categoryId },
                        select: {
                            id: true,
                            translations: true,
                            subcategories: {
                                select: {
                                    id: true,
                                    translations: true,
                                    position: true,
                                    isVisible: true,
                                    _count: {
                                        select: { items: true },
                                    },
                                },
                                orderBy: { position: 'asc' },
                            },
                        },
                    },
                },
            });

            return {
                menu: {
                    id: menu?.id,
                    translations: menu?.translations,
                },
                category: {
                    id: menu?.categories[0].id,
                    translations: menu?.categories[0].translations,
                },
                subcategories: menu?.categories[0].subcategories.map((subcategory) => ({
                    id: subcategory.id,
                    translations: subcategory.translations,
                    position: subcategory.position,
                    isVisible: subcategory.isVisible,
                    itemsCount: subcategory._count.items,
                })),
            };
        } catch (error) {
            console.error('Error listing subcategories:', error);
            throw error;
        }
    }

    async createSubcategory(
        categoryId: string,
        createSubcategoryDto: CreateCategoryDto,
    ) {
        try {
            const slug = await this.getEstablishmentSlugByCategoryId(categoryId);
            const subcategoryCount = await this.prisma.menuSubcategory.count({
                where: { categoryId },
            })

            if (subcategoryCount >= 20) {
                throw new RpcException({
                    code: 403,
                    message: ERRORS.MAX_SUBCATEGORIES_REACHED,
                });
            }

            const { translations } = createSubcategoryDto;
            const newSubcategory = await this.prisma.menuSubcategory.create({
                data: {
                    categoryId,
                    translations: {
                        create: translations,
                    },
                    position: subcategoryCount + 1,
                },
                select: {
                    id: true,
                    translations: true,
                    position: true,
                    isVisible: true,
                },
            });

            this.menuUtilsService.clearMenuCacheAsync('menus', slug);
            return newSubcategory;
        } catch (error) {
            console.error('Error creating subcategory:', error);
            throw error;
        }
    }

    async updateSubcategory(
        subcategoryId: string,
        updateSubcategoryDto: any,
    ) {
        try {
            const slug = await this.getEstablishmentSlugBySubcategoryId(subcategoryId);
            const { translations, isVisible, position } = updateSubcategoryDto;

            await this.prisma.menuSubcategory.update({
                where: { id: subcategoryId },
                data: {
                    ...(isVisible !== undefined && { isVisible }),
                    ...(position !== undefined && { position }),
                },
            });

            // Update translations
            if (translations) {
                for (const translation of translations) {
                    await this.prisma.menuSubcategoryTranslation.upsert({
                        where: {
                            subcategoryId_locale: { subcategoryId, locale: translation.locale },
                        },
                        update: {
                            name: translation.name,
                            description: translation.description,
                        },
                        create: {
                            subcategoryId,
                            locale: translation.locale,
                            name: translation.name,
                            description: translation.description,
                        },
                    });
                }
            }

            this.menuUtilsService.clearMenuCacheAsync('menus', slug);
            return { success: true };
        } catch (error) {
            console.error('Error updating subcategory:', error);
            throw error;
        }
    }

    async deleteSubcategory(subcategoryId: string) {
        try {
            const slug = await this.getEstablishmentSlugBySubcategoryId(subcategoryId);
            await this.prisma.menuSubcategory.delete({
                where: { id: subcategoryId },
            });
            this.menuUtilsService.clearMenuCacheAsync('menus', slug);
            return { success: true };
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            throw error;
        }
    }

    async linkItemsToSubcategory(dto: LinkItemToSubcategoryDto) {
        const { subcategoryId, items } = dto;

        // 1️⃣ Validação da Subcategoria e busca do Menu/Slug
        const subcategory = await this.prisma.menuSubcategory.findUnique({
            where: { id: subcategoryId },
            include: {
                category: {
                    include: {
                        menu: { include: { establishment: true } }
                    }
                }
            }
        });

        if (!subcategory || !subcategory.category) {
            throw new RpcException({ message: ERRORS.SUBCATEGORY_NOT_FOUND, code: 404 });
        }

        const menu = subcategory.category.menu;
        const isRodizio = menu.type === MenuType.RODIZIO;

        // 2️⃣ Execução em Transação Serializável para evitar conflitos de posição
        await this.prisma.$transaction(async (tx) => {
            // Busca a contagem atual de itens na subcategoria
            const currentCount = await tx.menuItemPosition.count({
                where: { subcategoryId },
            });

            // Preparamos todas as promessas de upsert
            const upsertPromises = items.map((itemDto, index) => {
                const finalIsIncluded = isRodizio ? (itemDto.isIncluded ?? false) : false;
                return tx.menuItemPosition.upsert({
                    where: {
                        itemId_subcategoryId: {
                            itemId: itemDto.itemId,
                            subcategoryId
                        }
                    },
                    update: {
                        ...(itemDto.isVisible !== undefined && { isVisible: itemDto.isVisible }),
                        ...(finalIsIncluded !== undefined && { isIncluded: finalIsIncluded }),
                    },
                    create: {
                        itemId: itemDto.itemId,
                        subcategoryId,
                        // A posição é o total atual + a posição no array + 1
                        position: currentCount + index + 1,
                        isVisible: itemDto.isVisible ?? true,
                        isIncluded: finalIsIncluded ?? false,
                    },
                });
            });

            await Promise.all(upsertPromises);
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable //ATENÇÃO Á PERFORMANCE -> COSTA 11/04/26
        });

        // 3️⃣ Invalidação de Cache
        this.menuUtilsService.clearMenuCacheAsync('menus', menu.establishment.slug);

        return { success: true };
    }


    async unlinkItemsFromSubcategory(subcategoryId: string, itemIds: string[]) {
        const subcategory = await this.prisma.menuSubcategory.findUnique({
            where: { id: subcategoryId },
            include: {
                category: {
                    include: {
                        menu: { include: { establishment: true } }
                    }
                }
            }
        });

        if (!subcategory || !subcategory.category) {
            throw new RpcException({ message: ERRORS.SUBCATEGORY_NOT_FOUND, code: 404 });
        }

        await this.prisma.menuItemPosition.deleteMany({
            where: {
                subcategoryId,
                itemId: { in: itemIds }
            }
        });

        this.menuUtilsService.clearMenuCacheAsync('menus', subcategory.category.menu.establishment.slug);
        return { success: true };
    }

    async updateItemPositions(subcategoryId: string, positions: { id: string; position: number }[]) {
        const subcategory = await this.prisma.menuSubcategory.findUnique({
            where: { id: subcategoryId },
            include: {
                category: {
                    include: {
                        menu: { include: { establishment: true } }
                    }
                }
            }
        });

        if (!subcategory || !subcategory.category) {
            throw new RpcException({ message: ERRORS.SUBCATEGORY_NOT_FOUND, code: 404 });
        }

        await this.prisma.$transaction(
            positions.map((p) =>
                this.prisma.menuItemPosition.update({
                    where: { itemId_subcategoryId: { itemId: p.id, subcategoryId } },
                    data: { position: p.position },
                }),
            ),
        );

        this.menuUtilsService.clearMenuCacheAsync('menus', subcategory.category.menu.establishment.slug);
        return { success: true };
    }

    async updateItemsLinkProperties(subcategoryId: string, itemIds: string[], data: { isVisible?: boolean, isIncluded?: boolean }) {
        const subcategory = await this.prisma.menuSubcategory.findUnique({
            where: { id: subcategoryId },
            include: {
                category: {
                    include: {
                        menu: { include: { establishment: true } }
                    }
                }
            }
        });

        if (!subcategory || !subcategory.category) {
            throw new RpcException({ message: ERRORS.SUBCATEGORY_NOT_FOUND, code: 404 });
        }

        await this.prisma.menuItemPosition.updateMany({
            where: {
                subcategoryId,
                itemId: { in: itemIds }
            },
            data
        });

        this.menuUtilsService.clearMenuCacheAsync('menus', subcategory.category.menu.establishment.slug);
        return { success: true };
    }

    async updateSubcategoryPositions(
        menuId: string,
        categoryId: string,
        updateSubcategoryPositionsDto: UpdateSubcategoryPositionsDto,
    ) {
        try {
            const { positions } = updateSubcategoryPositionsDto;
            const slug = await this.getEstablishmentSlugByCategoryId(categoryId);

            await this.prisma.$transaction(
                positions.map((p) =>
                    this.prisma.menuSubcategory.update({
                        where: {
                            id: p.id,
                            categoryId: categoryId,
                        },
                        data: { position: p.position },
                    }),
                ),
            );

            this.menuUtilsService.clearMenuCacheAsync('menus', slug);
            return { success: true };
        } catch (error) {
            console.error('Error updating subcategory positions:', error);
            throw error;
        }
    }

    async getSubcategoryItems(establishment: Establishment, subcategoryId: string) {
        try {
            const subcategory = await this.prisma.menuSubcategory.findUnique({
                where: { id: subcategoryId },
                select: {
                    id: true,
                    categoryId: true,
                    translations: true,
                    isVisible: true,
                    category: {
                        select: {
                            id: true,
                            translations: true,
                            menu: {
                                select: {
                                    id: true,
                                    translations: true,
                                    type: true,
                                }
                            }
                        }
                    },
                    items: {
                        orderBy: { position: 'asc' },
                        select: {
                            isVisible: true,
                            position: true,
                            isIncluded: true,
                            item: {
                                include: ITEM_DETAIL_INCLUDE
                            }
                        }
                    },
                },
            },
            );

            if (!subcategory || !subcategory.category || !subcategory.category.menu) throw new RpcException({
                message: ERRORS.SUBCATEGORY_NOT_FOUND, code: 404
            })

            const subTr = subcategory.translations.find(t => t.locale === establishment.primaryLanguage) || subcategory.translations[0];
            const catTr = subcategory.category.translations.find(t => t.locale === establishment.primaryLanguage) || subcategory.category.translations[0];
            const menuTr = subcategory.category.menu.translations.find(t => t.locale === establishment.primaryLanguage) || subcategory.category.menu.translations[0];

            return {
                id: subcategory.id,
                name: subTr?.name || 'Sem nome',
                description: subTr?.description,
                isVisible: subcategory.isVisible,
                category: {
                    id: subcategory.category.id,
                    name: catTr?.name || 'Sem nome',
                },
                menu: {
                    id: subcategory.category.menu.id,
                    type: subcategory.category.menu.type,
                    name: menuTr?.name || 'Sem nome',
                },
                items: subcategory.items.map(itemPos => ({
                    position: itemPos.position,
                    isVisible: itemPos.isVisible,
                    isIncluded: itemPos.isIncluded,
                    ...mapTranslatedItemDetailResponse(itemPos.item, establishment.primaryLanguage),
                }))
            };
        } catch (error) {
            console.error('Error getting subcategory items:', error);
            throw error;
        }
    }

}
