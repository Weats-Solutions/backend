export const feature = {
  menu: 'menu',
  languages: 'languages',
  menu_settings: 'menu_settings',
  booking: 'booking',
  points: 'points',
} as const;

export type feature = (typeof feature)[keyof typeof feature];

export type featureType = 'quantity' | 'boolean';
