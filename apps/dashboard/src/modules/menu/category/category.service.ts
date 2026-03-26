import { Injectable, NotFoundException } from "@nestjs/common";
import { CorePrismaService } from "@weats/database";
import { Establishment } from "@weats/types";
import { CreateCategoryDto } from "@weats/contracts";

@Injectable()
export class MenuCategoryService {
    constructor(private readonly prisma: CorePrismaService) {

    }
    async createCategory(
        menuId: string,
        createCategoryDto: CreateCategoryDto,
    ) {
        try {
            const categoryCount = await this.prisma.menuCategory.count({
                where: { menuId },
            })
            const { translations, imageId } = createCategoryDto;
            const newCategory = await this.prisma.menuCategory.create({
                data: {
                    menuId,
                    imageId: imageId || null,
                    translations: {
                        create: translations,
                    },
                    position: categoryCount + 1,
                },
                select: {
                    id: true,
                    translations: true,
                    isVisible: true,
                    position: true,
                    image: { select: { id: true, url: true } },
                },
            });

            const response = {
                id: newCategory.id,
                translations: newCategory.translations,
                isVisible: newCategory.isVisible,
                position: newCategory.position,
                imageId: newCategory.image?.id,
                imageUrl: newCategory.image?.url,
            };

            return response;
        } catch (error) {
            console.error('Error creating menu category:', error);
            throw error;
        }
    }

    async listMenuCategories(menuId: string, establishment: Establishment) {
        try {
            const menu = await this.prisma.menu.findFirst({
                where: { id: menuId, establishmentId: establishment.id },
                select: {
                    id: true,
                    translations: {
                        select: { locale: true, name: true },
                    },
                    categories: {
                        select: {
                            id: true,
                            isVisible: true,
                            position: true,
                            _count: {
                                select: { subcategories: true },
                            },
                            image: {
                                select: { id: true, url: true },
                            },
                            translations: {

                                select: { locale: true, name: true },
                            },
                        },
                        orderBy: { position: 'asc' },
                    },
                },
            });

            if (!menu) {
                throw new NotFoundException('Menu not found');
            }

            const response = {
                menu: {
                    id: menu.id,
                    translations: menu.translations,
                },
                categories:
                    menu.categories?.map((category) => ({
                        id: category.id,
                        translations: category.translations,
                        isVisible: category.isVisible,
                        position: category.position,
                        imageId: category.image?.id,
                        imageUrl: category.image?.url,
                        subcategoriesCount: category._count.subcategories,
                    })) || [],
            };

            return response;
        } catch (error) {
            console.error('Error listing menu categories:', error);
            throw error;
        }
    }

    async updateCategory(
        menuId: string,
        categoryId: string,
        updateCategoryDto: CreateCategoryDto,
        establishment: Establishment,
    ) {
        try {
            const { translations, imageId, isVisible } = updateCategoryDto;
            const category = await this.prisma.menuCategory.findFirst({
                where: {
                    id: categoryId,
                    menu: { id: menuId, establishmentId: establishment.id },
                },
            });
            if (!category) {
                throw new NotFoundException('Category not found');
            }

            // Update category fields (imageId and isVisible)
            await this.prisma.menuCategory.update({
                where: { id: categoryId },
                data: {
                    ...(imageId !== undefined && { imageId: imageId || null }),
                    ...(isVisible !== undefined && { isVisible }),
                },
            });

            // Update translations
            for (const translation of translations) {
                await this.prisma.menuCategoryTranslation.upsert({
                    where: {
                        categoryId_locale: { categoryId, locale: translation.locale },
                    },
                    update: { name: translation.name },
                    create: {
                        categoryId,
                        locale: translation.locale,
                        name: translation.name,
                    },
                });
            }
            const updatedCategory = await this.prisma.menuCategory.findUnique({
                where: { id: categoryId },
                select: {
                    id: true,
                    isVisible: true,
                    image: { select: { id: true, url: true } },
                    translations: { select: { locale: true, name: true } },
                },
            });

            if (!updatedCategory) {
                throw new NotFoundException('Category not found after update');
            }

            const response = {
                id: updatedCategory.id,
                translations: updatedCategory.translations,
                isVisible: updatedCategory.isVisible,
                imageId: updatedCategory.image?.id,
                imageUrl: updatedCategory.image?.url,
            };
            return response;
        } catch (error) {
            console.error('Error updating menu category:', error);
            throw error;
        }
    }

    async listSubcategories(
        menuId: string,
        categoryId: string,
        establishment: Establishment,
    ) {
        try {
            const menu = await this.prisma.menu.findFirst({
                where: { id: menuId, establishmentId: establishment.id },
                select: {
                    id: true,
                    translations: {
                        where: { locale: establishment.primaryLanguage },
                        select: {
                            name: true,
                        },
                    },
                    categories: {
                        where: { id: categoryId },
                        select: {
                            id: true,
                            translations: {
                                where: { locale: establishment.primaryLanguage },
                                select: {
                                    name: true,
                                },
                            },
                            subcategories: {
                                select: {
                                    id: true,
                                    translations: {
                                        where: { locale: establishment.primaryLanguage },
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!menu) {
                throw new NotFoundException('Menu not found');
            }

            const category = menu.categories[0];
            if (!category) {
                throw new NotFoundException('Category not found');
            }

            const response = {
                menu: {
                    id: menuId,
                    name: menu.translations[0]?.name || '',
                },
                category: {
                    id: category.id,
                    name: category.translations[0]?.name || '',
                },
                subcategories:
                    category.subcategories?.map((subcategory) => ({
                        id: subcategory.id,
                        name: subcategory.translations[0]?.name || '',
                    })) || [],
            };
            return response;
        } catch (error) {
            console.error('Error listing menu subcategories:', error);
            throw error;
        }
    }

    async deleteCategory(
        menuId: string,
        categoryId: string,
        establishment: Establishment,
    ) {
        try {
            const category = await this.prisma.menuCategory.findFirst({
                where: {
                    id: categoryId,
                    menu: { id: menuId, establishmentId: establishment.id },
                },
            });

            if (!category) {
                throw new NotFoundException('Category not found');
            }

            // Delete category (translations and subcategories will be cascade deleted)
            await this.prisma.menuCategory.delete({
                where: { id: categoryId },
            });

            return { success: true, message: 'Category deleted successfully' };
        } catch (error) {
            console.error('Error deleting menu category:', error);
            throw error;
        }
    }

}