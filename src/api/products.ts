import { apiClient } from "./client";

// Products API request types
export interface ProductsListParams {
  page?: number;
  perPage?: number;
  category?: string;
  search?: string;
  isActive?: string; // "1" to fetch active products only (buyer side)
}

// Products API response types (matching the actual API structure)
export interface ApiProductData {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  productDescription: string;
  productTags: string[];
  unitPrice: string;
  discountType: string;
  discountValue: string;
  discountPrice: string;
  stock: string;
  minStock: string;
  images: string[];
  isActive: string;
  storeName: string;
  vendorLogo?: string; // URL-encoded JSON string containing logo URLs
  vendorId?: string;
  isSubaccountSet?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListResponse {
  status: number;
  error: boolean;
  message: string;
  data: ApiProductData[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface SingleProductResponse {
  status: number;
  error: boolean;
  message: string;
  data: ApiProductData;
}

export interface ProductRatingsResponse {
  status: number;
  error: boolean;
  message: string;
  data: {
    totalRating: string;
    ratingCount: string;
  };
}

// Products API endpoints
export const productsApi = {
  // Get products list (uses Basic Auth)
  getProducts: async (
    params: ProductsListParams = {}
  ): Promise<ProductsListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page.toString());
    if (params.perPage)
      searchParams.append("perPage", params.perPage.toString());
    if (params.category) searchParams.append("category", params.category);
    if (params.search) searchParams.append("search", params.search);
    if (params.isActive) searchParams.append("isActive", params.isActive);

    const queryString = searchParams.toString();
    const endpoint = `/product/items${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<ProductsListResponse>(endpoint, undefined, false); // Use Basic Auth
  },

  // Get single product (uses Basic Auth)
  getProduct: async (productId: string): Promise<SingleProductResponse> => {
    return apiClient.get<SingleProductResponse>(
      `/product/item-info/${productId}`,
      undefined,
      false
    );
  },

  // Get products by category (uses Basic Auth)
  getProductsByCategory: async (
    categoryId: string,
    params: Omit<ProductsListParams, "category"> = {}
  ): Promise<ProductsListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page.toString());
    if (params.perPage)
      searchParams.append("perPage", params.perPage.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.isActive) searchParams.append("isActive", params.isActive);

    const queryString = searchParams.toString();
    const endpoint = `/product/category/${categoryId}/items${
      queryString ? `?${queryString}` : ""
    }`;

    return apiClient.get<ProductsListResponse>(endpoint, undefined, false); // Use Basic Auth
  },

  /**
   * Track product view for recently-viewed recommendations.
   * POST /product/:productId/track-view. Requires Bearer token. No response body.
   */
  trackProductView: async (productId: string): Promise<void> => {
    return apiClient.postNoBody(`/product/${productId}/track-view`, true);
  },

  /**
   * Get product ratings (uses Basic Auth - public endpoint)
   * GET /product/:productId/ratings
   */
  getProductRatings: async (productId: string): Promise<ProductRatingsResponse> => {
    return apiClient.get<ProductRatingsResponse>(
      `/product/${productId}/ratings`,
      undefined,
      false // Use Basic Auth for public ratings
    );
  },
};
