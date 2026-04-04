import axios from 'axios';

export const clearMenuCacheAsync = (slug?: string | null) => {
    if (!slug) return;

    const menuUrl = process.env.NEXT_PUBLIC_MENU_URL;
    const token = process.env.MENU_CACHE_TOKEN;

    if (!menuUrl || !token) {
        console.warn('Menu cache clear skipped: missing NEXT_PUBLIC_MENU_URL or MENU_CACHE_TOKEN');
        return;
    }

    void axios
        .post(
            `${menuUrl}/api/clear-cache`,
            { slug },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        )
        .catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`Menu cache clear failed: ${message}`);
        });
};
