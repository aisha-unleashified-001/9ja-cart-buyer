import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CouponPricingSnapshot } from "../api/order";

export interface CheckoutCouponStoreState {
  appliedCoupon: string | null;
  pricingSnapshot: CouponPricingSnapshot | null;
  setPersistedCoupon: (
    code: string | null,
    snapshot: CouponPricingSnapshot | null
  ) => void;
  clearPersistedCoupon: () => void;
}

export const useCheckoutCouponStore = create<CheckoutCouponStoreState>()(
  persist(
    (set) => ({
      appliedCoupon: null,
      pricingSnapshot: null,
      setPersistedCoupon: (code, snapshot) =>
        set({
          appliedCoupon: code,
          pricingSnapshot: snapshot,
        }),
      clearPersistedCoupon: () =>
        set({
          appliedCoupon: null,
          pricingSnapshot: null,
        }),
    }),
    {
      name: "checkout-coupon-session",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
