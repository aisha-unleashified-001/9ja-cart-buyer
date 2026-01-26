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
import type { Product, ProductSummary } from "../../types";

const BUYER_FETCH_PER_PAGE = 100;

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
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const hasFetchedRef = useRef(false); // Prevent double fetching in StrictMode

  const fetchProducts = useCallback(
    async (params: ProductsListParams = {}) => {
      console.log("🚀 Fetching products:", { ...initialParams, ...params });
      setLoading(true);
      setError(null);

      try {
        const mergedParams: ProductsListParams = {
          ...initialParams,
          ...params,
          // Buyer-side rule: only show active products
          isActive: "1",
        };
        const response = await productsApi.getProducts(mergedParams);

        // Map API response to internal types
        const mappedProducts = mapApiProductsToProductSummaries(response.data);

        setProducts(mappedProducts);
        setPagination(response.pagination);
        console.log("✅ Loaded", mappedProducts.length, "products");
      } catch (err) {
        const errorMessage = apiErrorUtils.getErrorMessage(err);
        setError(errorMessage);
        console.error("❌ Failed to fetch products:", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [initialParams]
  ); // Remove dependency to prevent re-fetching

  // Load products on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchProducts();
    }
  }, [fetchProducts]);

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
export const useBuyerActiveProductsList = (params: ProductsListParams = {}) => {
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch the dataset when filters change (search, etc.)
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

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
  }, [search]);

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

  return { products, loading, error, pagination };
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
    loading,
    error,
    pagination,
  };
};
