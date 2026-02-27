import { useState, useEffect, useCallback, useRef } from "react";
import { categoriesApi, type CategoriesListParams } from "../../api/categories";
import {
  mapApiCategoriesToCategories,
  combineWithServicesCategories,
} from "../../utils/category-mappers";
import { apiErrorUtils } from "../../utils/api-errors";
import {
  loadCategoriesFromSession,
  saveCategoriesToSession,
} from "../../lib/sessionCache";
import type { Category } from "../../types";

// Hook for fetching real categories list
export const useRealCategories = (initialParams: CategoriesListParams = {}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const hasFetchedRef = useRef(false); // Prevent double fetching in StrictMode

  const fetchCategories = useCallback(
    async (params: CategoriesListParams = {}) => {
      console.log("🚀 Fetching categories:", { ...initialParams, ...params });
      setLoading(true);
      setError(null);

      try {
        const mergedParams = { ...initialParams, ...params };
        const response = await categoriesApi.getCategories(mergedParams);

        // Map API response to internal types
        const mappedCategories = mapApiCategoriesToCategories(response.data);
        
        // Combine with services categories
        const allCategories = combineWithServicesCategories(mappedCategories);

        setCategories(allCategories);
        setPagination(response.pagination);
        console.log("✅ Loaded", allCategories.length, "categories (including services)");
      } catch (err) {
        const errorMessage = apiErrorUtils.getErrorMessage(err);
        setError(errorMessage);
        console.error("❌ Failed to fetch categories:", errorMessage);
        
        // Fallback to services categories only if API fails
        const servicesOnly = combineWithServicesCategories([]);
        setCategories(servicesOnly);
        console.log("🔄 Fallback: Using services categories only");
      } finally {
        setLoading(false);
      }
    },
    [] // Remove initialParams dependency to prevent infinite loops
  );

  // Load categories on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCategories(initialParams);
    }
  }, []); // Empty dependency array to run only once

  const refetch = useCallback(
    (params?: CategoriesListParams) => {
      return fetchCategories(params || initialParams);
    },
    [fetchCategories, initialParams]
  );

  // Helper to get main categories (level 1)
  const getMainCategories = useCallback(() => {
    return categories.filter(cat => cat.level === 1);
  }, [categories]);

  // Helper to get subcategories for a parent
  const getSubcategories = useCallback((parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  }, [categories]);

  // Helper to get services subcategories
  const getServicesSubcategories = useCallback(() => {
    return getSubcategories("services");
  }, [getSubcategories]);

  return {
    categories,
    loading,
    error,
    pagination,
    refetch,
    // Helper functions
    getMainCategories,
    getSubcategories,
    getServicesSubcategories,
  };
};

// Module-level in-memory cache for categories - survives navigation (SPA)
const CATEGORIES_MEMORY_TTL_MS = 5 * 60 * 1000; // 5 minutes
let categoriesMemoryCache: { categories: Category[]; ts: number } | null = null;
let categoriesFetchPromise: Promise<void> | null = null;

function getMemoryCachedCategories(): Category[] | null {
  if (
    categoriesMemoryCache &&
    Date.now() - categoriesMemoryCache.ts < CATEGORIES_MEMORY_TTL_MS
  ) {
    return categoriesMemoryCache.categories;
  }
  return null;
}

function initCategoriesFromStorage(): Category[] {
  // Use in-memory first (navigation back), then sessionStorage (reload)
  const mem = getMemoryCachedCategories();
  if (mem) return mem;
  const session = loadCategoriesFromSession();
  if (session) return session.categories as Category[];
  return [];
}

// Hook for getting all categories (fetch all pages) - Stable version
// Module-level cache means navigate-back shows data instantly, no loading state
export const useAllRealCategories = () => {
  const initialCategories = initCategoriesFromStorage();
  const hasCached = initialCategories.length > 0;

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(!hasCached);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCategories = useCallback(async () => {
    // Re-use in-flight request if one is already running (StrictMode, concurrent mounts).
    // After it completes, sync this instance's state from the shared cache so sidebar + Shop by Category both render.
    if (categoriesFetchPromise) {
      await categoriesFetchPromise;
      const cached = getMemoryCachedCategories();
      if (cached) {
        setCategories(cached);
        setLoading(false);
      }
      return;
    }

    // Already have fresh memory cache — sync this instance and skip fetch so first load shows immediately when cache exists.
    const cached = getMemoryCachedCategories();
    if (cached) {
      setCategories(cached);
      setLoading(false);
      return;
    }

    if (!hasCached) setLoading(true);
    setError(null);

    categoriesFetchPromise = (async () => {
      try {
        const response = await categoriesApi.getCategories({ page: 1, perPage: 100 });
        const mappedCategories = mapApiCategoriesToCategories(response.data);
        const allCategories = combineWithServicesCategories(mappedCategories);

        categoriesMemoryCache = { categories: allCategories, ts: Date.now() };
        saveCategoriesToSession({ categories: allCategories, ts: Date.now() });
        setCategories(allCategories);
      } catch (err) {
        const errorMessage = apiErrorUtils.getErrorMessage(err);
        setError(errorMessage);
        const servicesOnly = combineWithServicesCategories([]);
        categoriesMemoryCache = { categories: servicesOnly, ts: Date.now() };
        setCategories(servicesOnly);
      } finally {
        setLoading(false);
        categoriesFetchPromise = null;
      }
    })();

    await categoriesFetchPromise;
    // Sync this instance from cache in case this is the only consumer (no re-render from the promise's setState yet).
    const afterCached = getMemoryCachedCategories();
    if (afterCached) {
      setCategories(afterCached);
      setLoading(false);
    }
  }, [hasCached]);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  // Helper functions
  const getMainCategories = useCallback(() => {
    return categories.filter(cat => cat.level === 1);
  }, [categories]);

  const getSubcategories = useCallback((parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  }, [categories]);

  const getServicesSubcategories = useCallback(() => {
    return getSubcategories("services");
  }, [getSubcategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchAllCategories,
    getMainCategories,
    getSubcategories,
    getServicesSubcategories,
  };
};