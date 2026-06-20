export const feature = {
  menu: 'menu',
  languages: 'languages',
  products: 'products',
  custom_variants: 'custom_variants',
  custom_addons: 'custom_addons',
  zones: 'zones',
  points: 'points',
  images: 'images',
  custom_qrcodes: 'custom_qrcodes',
  qrcode_rules: 'qrcode_rules',

  call_staff: 'call_staff',
  reservations: 'reservations',
  external_links: 'external_links',

  theme_builder: 'theme_builder',

  expenses: 'expenses',
  metadata: 'metadata',
  google_analytics: 'google_analytics',

  menu_categories: 'menu_categories',
  menu_subcategories: 'menu_subcategories',
} as const;

//bloquear 10 categorias
//bloquear 25 subcategorias

export type feature = (typeof feature)[keyof typeof feature];

export type featureType = 'quantity' | 'boolean';
