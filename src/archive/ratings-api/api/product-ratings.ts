/**
 * ARCHIVED: Product Ratings API Implementation
 * 
 * This file contains the archived product ratings API types and methods.
 * Archived on: 2025-12-23
 * 
 * To restore:
 * 1. Copy ProductRating and ProductRatingsResponse types back to src/api/products.ts
 * 2. Copy getProductRatings method back to productsApi in src/api/products.ts
 * 3. Restore useProductRatings hook from src/archive/ratings-api/hooks/useProductRatings.ts
 * 4. Restore usage in ProductCard.tsx and ProductDetailPage.tsx
 */

import { apiClient } from "../../../api/client";

// Product Ratings API response types
export interface ProductRating {
  id: string;
  productId: string;
  vendorId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductRatingsResponse {
  status: number;
  error: boolean;
  message: string;
  data: {
    average: number;
    total: number;
    ratings: ProductRating[];
  };
}

// Get product ratings (uses Basic Auth - public endpoint)
export const getProductRatings = async (productId: string): Promise<ProductRatingsResponse> => {
  return apiClient.get<ProductRatingsResponse>(
    `/product/${productId}/ratings`,
    undefined,
    false // Use Basic Auth for public ratings
  );
};















