import { create } from "zustand";
import type { OrderRating } from "../types";

/** Aggregated rating for a product (from order ratings) */
export interface ProductRatingSummary {
  average: number;
  total: number;
}

interface ProductRatingsState {
  /** productId -> { sum of ratings, count } for aggregating */
  byProduct: Record<string, { sum: number; count: number }>;
  /** Merge order ratings into the store (filters by productId when present) */
  setRatingsFromOrder: (ratings: OrderRating[]) => void;
  /** Get aggregated rating for a product, if any */
  getRating: (productId: string) => ProductRatingSummary | undefined;
}

export const useProductRatingsStore = create<ProductRatingsState>()((set, get) => ({
  byProduct: {},

  setRatingsFromOrder: (ratings) => {
    if (!Array.isArray(ratings) || ratings.length === 0) return;
    set((state) => {
      const next = { ...state.byProduct };
      for (const r of ratings) {
        const productId = r.productId ?? (r as OrderRating & { product_id?: string }).product_id;
        if (!productId || r.rating == null) continue;
        const current = next[productId] ?? { sum: 0, count: 0 };
        next[productId] = {
          sum: current.sum + Number(r.rating),
          count: current.count + 1,
        };
      }
      return { byProduct: next };
    });
  },

  getRating: (productId) => {
    const entry = get().byProduct[productId];
    if (!entry || entry.count === 0) return undefined;
    return {
      average: Math.round((entry.sum / entry.count) * 10) / 10,
      total: entry.count,
    };
  },
}));
