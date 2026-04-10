import { CorePrismaService } from "@weats/database";
import { Injectable } from "@nestjs/common";
import { CreateCategoryDto, UpdateSubcategoryPositionsDto } from "@weats/contracts";
import { clearMenuCacheAsync } from '@weats/common';

@Injectable()
export class MenuSubcategoryService {
    constructor(private readonly prisma: CorePrismaService) { }

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

            clearMenuCacheAsync(slug);
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

            clearMenuCacheAsync(slug);
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
            clearMenuCacheAsync(slug);
            return { success: true };
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            throw error;
        }
    }

    async linkItemToSubcategory(subcategoryId: string, itemId: string) {
        const slug = await this.getEstablishmentSlugBySubcategoryId(subcategoryId);
        // 1️⃣ valida existência
        const [subcategory, item] = await Promise.all([
            this.prisma.menuSubcategory.findUnique({ where: { id: subcategoryId } }),
            this.prisma.item.findUnique({ where: { id: itemId } }),
        ]);

        if (!subcategory) throw new Error(`Subcategory ${subcategoryId} not found`);
        if (!item) throw new Error(`Item ${itemId} not found`);

        // 2️⃣ conta itens
        const itemsCount = await this.prisma.menuItemPosition.count({
            where: { subcategoryId },
        });

        // 3️⃣ upsert seguro
        await this.prisma.menuItemPosition.upsert({
            where: { itemId_subcategoryId: { itemId, subcategoryId } },
            update: { isVisible: true },
            create: { itemId, subcategoryId, position: itemsCount + 1, isVisible: true },
        });

        clearMenuCacheAsync(slug);
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

            clearMenuCacheAsync(slug);
            return { success: true };
        } catch (error) {
            console.error('Error updating subcategory positions:', error);
            throw error;
        }
    }

}
