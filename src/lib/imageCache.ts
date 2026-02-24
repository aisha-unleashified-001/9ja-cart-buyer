/**
 * Image caching utility.
 *
 * Two layers:
 *  1. Memory cache (Map) — survives SPA navigation, cleared on page reload.
 *     Used to serve blob URLs instantly on navigate-back with no async cost.
 *  2. Cache API — survives page reload (same tab). Used to serve images without
 *     a network request on reload when HTTP cache headers are absent.
 *
 * Race-safety: a module-level in-flight map ensures that concurrent calls for
 * the same URL share a single Promise, so only one blob URL is ever created per
 * image URL. This prevents ERR_FILE_NOT_FOUND errors from prematurely revoked
 * blob URLs.
 */

const CACHE_NAME = '9ja-buyer-images-v1';

// ─── Layer 1: in-memory blob URL map ────────────────────────────────────────
// Blob URLs stored here are NEVER individually revoked — the browser cleans
// them all up when the document unloads (page reload / tab close).
const memoryBlobCache = new Map<string, string>(); // url → blobUrl

export function getMemoryCachedBlob(url: string): string | null {
  return memoryBlobCache.get(url) ?? null;
}

// ─── In-flight deduplication ─────────────────────────────────────────────────
// Prevents multiple concurrent callers from each creating their own blob URL
// for the same image, which would cause the earlier blobs to be "lost" and
// trigger ERR_FILE_NOT_FOUND when the browser tries to load them.
const inflightFetches = new Map<string, Promise<string>>();

const isCacheSupported = (): boolean => typeof caches !== 'undefined';

/**
 * Resolves to a blob URL for the given image URL.
 * Resolution order:
 *  1. Memory blob cache (synchronous path via getMemoryCachedBlob, instant on navigate-back)
 *  2. In-flight deduplication (multiple callers share one Promise)
 *  3. Cache API (no network, fast on reload)
 *  4. Network fetch → stored in Cache API and memory cache
 *  5. Raw URL fallback if everything above fails
 */
async function resolveBlobUrl(url: string): Promise<string> {
  // 1. Memory cache — synchronous, instant on navigate-back
  const mem = memoryBlobCache.get(url);
  if (mem) return mem;

  // 2. In-flight deduplication — share one promise instead of racing
  const inflight = inflightFetches.get(url);
  if (inflight) return inflight;

  const promise = (async (): Promise<string> => {
    try {
      if (isCacheSupported()) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(url);

        if (cached) {
          // 3. Cache API hit — no network needed
          const blob = await cached.blob();
          const blobUrl = URL.createObjectURL(blob);
          memoryBlobCache.set(url, blobUrl);
          return blobUrl;
        }

        // 4. Network fetch
        const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
        if (response.ok) {
          await cache.put(url, response.clone());
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          memoryBlobCache.set(url, blobUrl);
          return blobUrl;
        }
      }
    } catch {
      // fall through to raw URL
    } finally {
      inflightFetches.delete(url);
    }
    // 5. Fallback: use raw URL (HTTP cache / network)
    return url;
  })();

  inflightFetches.set(url, promise);
  return promise;
}

/**
 * Public API used by the Image component.
 * Always returns revoke: false because blob URLs are owned by the memory cache,
 * not by individual components.
 */
export const getCachedImageUrl = async (
  url: string
): Promise<{ url: string; revoke: boolean }> => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { url: '', revoke: false };
  }
  const resolved = await resolveBlobUrl(url);
  return { url: resolved, revoke: false };
};
