/**
 * Preload the product detail page chunk so navigation feels instant (no Suspense fallback).
 * Call on product link hover/focus.
 */
let preloaded = false;

export function preloadProductDetailPage(): void {
  if (preloaded) return;
  preloaded = true;
  import("../pages/Products/ProductDetailPage");
}
