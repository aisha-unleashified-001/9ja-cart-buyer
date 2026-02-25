/**
 * Session storage cache for products and categories.
 * Survives page reloads within the same tab for instant display (< 1s).
 * Data is cleared when the tab is closed.
 */

const PRODUCTS_KEY = "9ja-buyer-products-cache";
const CATEGORIES_KEY = "9ja-buyer-categories-cache";
const PRODUCT_DETAIL_KEY = "9ja-buyer-product-detail-cache";
// Max age before a session-storage entry is evicted entirely (prevents very old data persisting)
const PRODUCTS_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
const CATEGORIES_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
const PRODUCT_DETAIL_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

function isStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Products cache: { [cacheKey]: { products, pagination, ts } }
export type ProductsCacheEntry = {
  products: unknown[];
  pagination: { currentPage: number; perPage: number; totalPages: number; totalItems: number };
  ts: number;
};

export function loadProductsFromSession(): Map<string, ProductsCacheEntry> {
  const map = new Map<string, ProductsCacheEntry>();
  if (!isStorageAvailable()) return map;
  try {
    const raw = sessionStorage.getItem(PRODUCTS_KEY);
    if (!raw) return map;
    const parsed = JSON.parse(raw) as Record<string, ProductsCacheEntry>;
    const now = Date.now();
    for (const [key, val] of Object.entries(parsed)) {
      // Only discard entries older than the hard max-age (30 min).
      // The hook's isCacheFresh check handles whether to silently refetch stale entries.
      if (val && val.ts && now - val.ts < PRODUCTS_MAX_AGE_MS) {
        map.set(key, val);
      }
    }
  } catch {
    // ignore parse errors
  }
  return map;
}

export function saveProductsToSession(
  data: Map<string, ProductsCacheEntry>
): void {
  if (!isStorageAvailable()) return;
  try {
    const obj: Record<string, ProductsCacheEntry> = {};
    data.forEach((v, k) => {
      obj[k] = v;
    });
    sessionStorage.setItem(PRODUCTS_KEY, JSON.stringify(obj));
  } catch {
    // ignore quota or other errors
  }
}

// Categories cache
export type CategoriesCacheEntry = { categories: unknown[]; ts: number };

export function loadCategoriesFromSession(): CategoriesCacheEntry | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = sessionStorage.getItem(CATEGORIES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CategoriesCacheEntry;
    if (!parsed?.categories || !parsed.ts) return null;
    // Discard entries older than the hard max-age; freshness is checked in the hook.
    if (Date.now() - parsed.ts >= CATEGORIES_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCategoriesToSession(entry: CategoriesCacheEntry): void {
  if (!isStorageAvailable()) return;
  try {
    sessionStorage.setItem(CATEGORIES_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

// Single product detail cache (by product id) for instant reload on product page
export type ProductDetailCacheEntry = { product: unknown; ts: number };

export function loadProductDetailFromSession(productId: string): ProductDetailCacheEntry | null {
  if (!isStorageAvailable() || !productId) return null;
  try {
    const raw = sessionStorage.getItem(PRODUCT_DETAIL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, ProductDetailCacheEntry>;
    const entry = parsed[productId];
    if (!entry?.product || !entry?.ts) return null;
    if (Date.now() - entry.ts >= PRODUCT_DETAIL_MAX_AGE_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

export function saveProductDetailToSession(
  productId: string,
  entry: ProductDetailCacheEntry
): void {
  if (!isStorageAvailable() || !productId) return;
  try {
    const raw = sessionStorage.getItem(PRODUCT_DETAIL_KEY);
    const parsed: Record<string, ProductDetailCacheEntry> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    // Evict old entries when saving
    const cleaned: Record<string, ProductDetailCacheEntry> = {};
    for (const [id, val] of Object.entries(parsed)) {
      if (val?.ts && now - val.ts < PRODUCT_DETAIL_MAX_AGE_MS) cleaned[id] = val;
    }
    cleaned[productId] = entry;
    sessionStorage.setItem(PRODUCT_DETAIL_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore
  }
}

/** Extract image URL from product (handles both { main } and array formats) */
function getProductImageUrl(p: { images?: { main?: string } | string[] }): string | null {
  if (!p?.images) return null;
  const img = p.images;
  if (typeof img === "object" && img !== null && "main" in img && typeof (img as { main?: string }).main === "string") {
    const url = (img as { main: string }).main;
    return url?.startsWith("http") ? url : null;
  }
  if (Array.isArray(img) && img.length > 0 && typeof img[0] === "string") {
    const url = img[0];
    return url?.startsWith("http") ? url : null;
  }
  return null;
}

/** Preload product images from session cache into browser. Call before React renders. */
export function preloadCachedProductImages(maxImages = 16): void {
  if (typeof document === "undefined" || !document.head) return;
  const cache = loadProductsFromSession();
  if (cache.size === 0) return;
  const seen = new Set<string>();
  let count = 0;
  for (const entry of cache.values()) {
    const products = entry?.products;
    if (!Array.isArray(products)) continue;
    for (const p of products) {
      if (count >= maxImages) return;
      const url = getProductImageUrl(p as { images?: { main?: string } | string[] });
      if (url && !seen.has(url)) {
        seen.add(url);
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = url;
        document.head.appendChild(link);
        count++;
      }
    }
  }
}
