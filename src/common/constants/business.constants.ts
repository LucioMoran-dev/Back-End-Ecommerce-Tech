export const SHIPPING = {
  FREE_THRESHOLD: 250,
  REDUCED_THRESHOLD: 100,
  STANDARD_COST: 20,
  REDUCED_COST: 10,
} as const;

export const TAX_RATE = 0.21;

export const MAX_PRODUCT_IMAGES = 8;
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
