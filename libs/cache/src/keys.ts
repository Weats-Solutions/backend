export const coreCacheKey = (slug: string) => `catalog:est:${slug}:core`;
export const menuListCacheKey = (slug: string, currentLang: string, targetId?: string) => `catalog:est:${slug}:lang:${currentLang}:menu${targetId ? `:target:${targetId}` : ''}`;
export const menuItemsCacheKey = (slug: string, currentLang: string, menuId: string) => `catalog:est:${slug}:lang:${currentLang}:menu:${menuId}:content`;

