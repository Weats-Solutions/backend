export const feature = {
  menu: 'menu',
  languages: 'languages',
  menu_settings: 'menu_settings',
  booking: 'booking',
  points: 'points',
  zones: 'zones',
  images: 'images',
  products: 'products',
  items: 'items',
} as const;

//bloquear 10 categorias
//bloquear 25 subcategorias

export type feature = (typeof feature)[keyof typeof feature];

export type featureType = 'quantity' | 'boolean';
