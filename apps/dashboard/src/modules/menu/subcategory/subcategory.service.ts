import { CorePrismaService } from "@weats/database";
import { Injectable } from "@nestjs/common";
import { CreateCategoryDto } from "@weats/contracts";

@Injectable()
export class MenuSubcategoryService {
    constructor(private readonly prisma: CorePrismaService) { }


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

            return { success: true };
        } catch (error) {
            console.error('Error updating subcategory:', error);
            throw error;
        }
    }

    async deleteSubcategory(subcategoryId: string) {
        try {
            await this.prisma.menuSubcategory.delete({
                where: { id: subcategoryId },
            });
            return { success: true };
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            throw error;
        }
    }
}
