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
  custom_qrcodes: 'custom_qrcodes',
  qrcode_rules: 'qrcode_rules',
} as const;

//bloquear 10 categorias
//bloquear 25 subcategorias

export type feature = (typeof feature)[keyof typeof feature];

export type featureType = 'quantity' | 'boolean';
