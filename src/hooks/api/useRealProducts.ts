import { useState, useEffect, useCallback, useRef } from "react";
import {
  productsApi,
  type ProductsListParams,
  type ProductsListResponse,
} from "../../api/products";
import {
  mapApiProductsToProductSummaries,
  mapApiProductToProduct,
} from "../../utils/product-mappers";
import { apiErrorUtils } from "../../utils/api-errors";
import { loadProductsFromSession, saveProductsToSession } from "../../lib/sessionCache";
import type { Product, ProductSummary } from "../../types";

const BUYER_FETCH_PER_PAGE = 100;

// In-memory cache - hydrated from sessionStorage on reload for instant display (< 1s)
const PRODUCTS_CACHE_STALE_MS = 2 * 60 * 1000; // 2 minutes

function initProductsCache(): Map<
  string,
  { products: ProductSummary[]; pagination: ProductsListResponse["pagination"]; ts: number }
> {
  const map = new Map<
    string,
    { products: ProductSummary[]; pagination: ProductsListResponse["pagination"]; ts: number }
  >();
  try {
    const fromSession = loadProductsFromSession();
    fromSession.forEach((v, k) => {
      map.set(k, v as { products: ProductSummary[]; pagination: ProductsListResponse["pagination"]; ts: number });
    });
  } catch {
    // ignore
  }
  return map;
}

const productsListCache = initProductsCache();

// In-flight fetch promises — prevents duplicate API calls when multiple components
// use the same hook params simultaneously (e.g. FlashSales + LiveProducts on homepage)
const inFlightFetches = new Map<string, Promise<void>>();

function getProductsListCacheKey(params: ProductsListParams): string {
  const { page = 1, perPage = 10, search } = params;
  return `products-${page}-${perPage}-${search?.trim() || ""}`;
}

async function fetchAllProductSummaries(
  getPage: (page: number) => Promise<ProductsListResponse>
): Promise<ProductSummary[]> {
  const first = await getPage(1);
  const totalPages = Math.max(1, first.pagination?.totalPages ?? 1);

  let all = mapApiProductsToProductSummaries(first.data);

  for (let page = 2; page <= totalPages; page++) {
    const res = await getPage(page);
    all = all.concat(mapApiProductsToProductSummaries(res.data));
  }

  return all;
}

// Hook for fetching real products list
export const useRealProductsList = (initialParams: ProductsListParams = {}) => {
  const cacheKey = getProductsListCacheKey(initialParams);

  // Stale-while-revalidate: show ANY cached data (even expired) so spinner never shows on reload.
  // Loading is only true when there is truly no data at all (hard reload / first visit).
  const anyCached = productsListCache.get(cacheKey);
  const isCacheFresh = anyCached != null && Date.now() - anyCached.ts < PRODUCTS_CACHE_STALE_MS;

  const [products, setProducts] = useState<ProductSummary[]>(
    anyCached ? anyCached.products : []
  );
  const [loading, setLoading] = useState(!anyCached);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(
    anyCached
      ? anyCached.pagination
      : { currentPage: 1, perPage: 10, totalPages: 1, totalItems: 0 }
  );

  const fetchProducts = useCallback(
    async (
      params: ProductsListParams = {},
      options?: { silent?: boolean }
    ) => {
      const mergedParams: ProductsListParams = {
        ...initialParams,
        ...params,
        isActive: "1",
      };
      const fetchKey = getProductsListCacheKey(mergedParams);

      // If an identical fetch is already in-flight, wait for it instead of firing a duplicate
      const existing = inFlightFetches.get(fetchKey);
      if (existing) {
        await existing;
        const updated = productsListCache.get(fetchKey);
        if (updated) {
          setProducts(updated.products);
          setPagination(updated.pagination);
          setLoading(false);
        }
        return;
      }

      if (!options?.silent) {
        setLoading(true);
        setError(null);
      }

      const fetchPromise = (async () => {
        try {
          const response = await productsApi.getProducts(mergedParams);
          const mappedProducts = mapApiProductsToProductSummaries(response.data);

          const entry = {
            products: mappedProducts,
            pagination: response.pagination,
            ts: Date.now(),
          };
          productsListCache.set(fetchKey, entry);
          saveProductsToSession(productsListCache);

          setProducts(mappedProducts);
          setPagination(response.pagination);
        } catch (err) {
          const errorMessage = apiErrorUtils.getErrorMessage(err);
          setError(errorMessage);
          if (!options?.silent) {
            console.error("❌ Failed to fetch products:", errorMessage);
          }
        } finally {
          setLoading(false);
          inFlightFetches.delete(fetchKey);
        }
      })();

      inFlightFetches.set(fetchKey, fetchPromise);
      await fetchPromise;
    },
    [initialParams]
  );

  // Load products on mount — stale-while-revalidate:
  // If cache is fresh → skip fetch entirely. If stale → fetch silently. If missing → fetch with spinner.
  useEffect(() => {
    if (!isCacheFresh) {
      fetchProducts({}, { silent: !!anyCached });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = useCallback(
    (params?: ProductsListParams) => {
      return fetchProducts(params);
    },
    [fetchProducts]
  );

  const loadMore = useCallback(async () => {
    if (pagination.currentPage < pagination.totalPages && !loading) {
      setLoading(true);
      try {
        const nextPage = pagination.currentPage + 1;
        const mergedParams: ProductsListParams = {
          ...initialParams,
          page: nextPage,
          // Buyer-side rule: only show active products
          isActive: "1",
        };
        const response = await productsApi.getProducts(mergedParams);

        // Map and append new products
        const newMappedProducts = mapApiProductsToProductSummaries(
          response.data
        );
        setProducts((prev) => [...prev, ...newMappedProducts]);
        setPagination(response.pagination);

        console.log(
          `✅ Loaded page ${nextPage}, total products: ${
            products.length + newMappedProducts.length
          }`
        );
      } catch (err) {
        const errorMessage = apiErrorUtils.getErrorMessage(err);
        setError(errorMessage);
        console.error("❌ Failed to load more products:", err);
      } finally {
        setLoading(false);
      }
    }
  }, [pagination, loading, initialParams, products.length]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch,
    loadMore,
    hasMore: pagination.currentPage < pagination.totalPages,
  };
};

// Buyer-side hook: always paginate over ACTIVE products only (no "holes")
// Uses the same session-backed cache as useRealProductsList so reloads are instant.
export const useBuyerActiveProductsList = (params: ProductsListParams = {}) => {
  const clientPage = Math.max(1, params.page ?? 1);
  const clientPerPage = Math.max(1, params.perPage ?? 10);
  const search = params.search?.trim() || undefined;

  // Cache key: buyer-active across all pages, keyed by search term
  const cacheKey = `buyer-active-${search || ""}`;
  const cachedEntry = productsListCache.get(cacheKey) as
    | {
        products: ProductSummary[];
        pagination: ProductsListResponse["pagination"];
        ts: number;
      }
    | undefined;
  const isCacheFresh =
    cachedEntry != null && Date.now() - cachedEntry.ts < PRODUCTS_CACHE_STALE_MS;

  const [allProducts, setAllProducts] = useState<ProductSummary[]>(
    cachedEntry ? cachedEntry.products : []
  );
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(!cachedEntry);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: cachedEntry?.pagination.currentPage ?? 1,
    perPage: cachedEntry?.pagination.perPage ?? clientPerPage,
    totalPages: cachedEntry?.pagination.totalPages ?? 1,
    totalItems: cachedEntry?.pagination.totalItems ?? 0,
  });

  const requestIdRef = useRef(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => setRefetchTrigger((t) => t + 1), []);

  // Fetch the full active-products dataset when filters change (search, etc.)
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setError(null);

    const shouldFetch = !isCacheFresh || refetchTrigger > 0;
    if (!shouldFetch) {
      // Cache is fresh and no explicit refetch → no spinner on reload.
      setLoading(false);
      return;
    }

    const useSilent = !!cachedEntry && refetchTrigger === 0;
    if (!useSilent) {
      setLoading(true);
    }

    fetchAllProductSummaries((page) =>
      productsApi.getProducts({
        page,
        perPage: BUYER_FETCH_PER_PAGE,
        ...(search ? { search } : {}),
        // Buyer-side rule: only show active products (API may ignore; we also filter client-side)
        isActive: "1",
      })
    )
      .then((allActive) => {
        if (requestId !== requestIdRef.current) return;

        setAllProducts(allActive);
        const totalItems = allActive.length;
        const totalPages = Math.max(
          1,
          Math.ceil(totalItems / (params.perPage ?? clientPerPage))
        );

        const entry = {
          products: allActive,
          pagination: {
            currentPage: 1,
            perPage: params.perPage ?? clientPerPage,
            totalPages,
            totalItems,
          },
          ts: Date.now(),
        };
        productsListCache.set(cacheKey, entry);
        saveProductsToSession(productsListCache);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        const errorMessage = apiErrorUtils.getErrorMessage(err);
        setError(errorMessage);
        setAllProducts([]);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, refetchTrigger]);

  // Apply client-side pagination (instant when page changes)
  useEffect(() => {
    const totalItems = allProducts.length;
    const perPage = clientPerPage;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const currentPage = Math.min(clientPage, totalPages);

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

    setProducts(allProducts.slice(start, end));
    setPagination({
      currentPage,
      perPage,
      totalPages,
      totalItems,
    });
  }, [allProducts, clientPage, clientPerPage]);

  return { products, allProducts, loading, error, pagination, refetch };
};

// Hook for fetching a single real product
export const useRealProduct = (productId: string | null) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await productsApi.getProduct(id);

      // Buyer-side rule: do not show inactive products
      if (response.data?.isActive !== "1") {
        setProduct(null);
        setError("Product not available");
        return;
      }

      // Map API response to internal type
      const mappedProduct = mapApiProductToProduct(response.data);

      setProduct(mappedProduct);
    } catch (err) {
      const errorMessage = apiErrorUtils.getErrorMessage(err);
      setError(errorMessage);
      console.error("Failed to fetch real product:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    } else {
      setProduct(null);
      setError(null);
    }
  }, [productId, fetchProduct]);

  const refetch = useCallback(() => {
    if (productId) {
      return fetchProduct(productId);
    }
  }, [productId, fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch,
  };
};

// Hook for featured products (first few products)
export const useFeaturedProducts = (count: number = 8) => {
  return useRealProductsList({ page: 1, perPage: count });
};

// Hook for products by category
export const useRealProductsByCategory = (categoryId: string | null, params: Omit<ProductsListParams, 'category'> = {}) => {
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const requestIdRef = useRef(0);

  const clientPage = Math.max(1, params.page ?? 1);
  const clientPerPage = Math.max(1, params.perPage ?? 10);
  const search = params.search?.trim() || undefined;

  // Fetch the dataset when category/filter changes
  useEffect(() => {
    if (!categoryId) {
      setAllProducts([]);
      setProducts([]);
      setError(null);
      setPagination((prev) => ({ ...prev, totalItems: 0, totalPages: 1 }));
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    fetchAllProductSummaries((page) =>
      productsApi.getProductsByCategory(categoryId, {
        page,
        perPage: BUYER_FETCH_PER_PAGE,
        ...(search ? { search } : {}),
        // Buyer-side rule: only show active products (API may ignore; we also filter client-side)
        isActive: "1",
      })
    )
      .then((allActive) => {
        if (requestId !== requestIdRef.current) return;
        setAllProducts(allActive);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        const errorMessage = apiErrorUtils.getErrorMessage(err);
        setError(errorMessage);
        setAllProducts([]);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [categoryId, search]);

  // Apply client-side pagination (instant when page changes)
  useEffect(() => {
    const totalItems = allProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / clientPerPage));
    const currentPage = Math.min(clientPage, totalPages);

    const start = (currentPage - 1) * clientPerPage;
    const end = start + clientPerPage;

    setProducts(allProducts.slice(start, end));
    setPagination({
      currentPage,
      perPage: clientPerPage,
      totalPages,
      totalItems,
    });
  }, [allProducts, clientPage, clientPerPage]);

  return {
    products,
    allProducts,
    loading,
    error,
    pagination,
  };
};
