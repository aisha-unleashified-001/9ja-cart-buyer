import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '../../api/products';
import type { ProductReviews } from '../../types';

interface UseProductRatingsResult {
  reviews: ProductReviews | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch product ratings from the API
 * @param productId - The product ID to fetch ratings for
 * @param enabled - Whether to fetch ratings (default: true)
 */
export const useProductRatings = (
  productId: string | null | undefined,
  enabled: boolean = true
): UseProductRatingsResult => {
  const [reviews, setReviews] = useState<ProductReviews | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRatings = useCallback(async () => {
    if (!productId || !enabled) {
      setReviews(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await productsApi.getProductRatings(productId);
      
      // Check if the response is successful and has valid data
      if (response.status === 200 && !response.error && response.data) {
        // Convert API response to ProductReviews format
        const totalRating = parseFloat(response.data.totalRating);
        const ratingCount = parseInt(response.data.ratingCount, 10);
        
        if (!isNaN(totalRating) && !isNaN(ratingCount) && ratingCount > 0) {
          setReviews({
            average: totalRating,
            total: ratingCount,
          });
        } else {
          // No valid ratings available
          setReviews(null);
        }
      } else {
        // API returned error or no data
        setReviews(null);
      }
    } catch (err: any) {
      // Silently handle errors - will use fallback ratings from product.reviews
      console.debug('Failed to fetch product ratings:', err.message);
      setReviews(null);
      setError(err.message || 'Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  }, [productId, enabled]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return {
    reviews,
    loading,
    error,
    refetch: fetchRatings,
  };
};
