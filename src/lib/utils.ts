import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeProductImages(product: any) {
  if (Array.isArray(product.images)) {
    return {
      ...product,
      images: {
        main: product.images[0] || "",
        gallery: product.images,
        videos: [],
      },
    };
  }

  // already normalized
  return product;
}
