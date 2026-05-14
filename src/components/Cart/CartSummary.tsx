import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Shield, RotateCcw, AlertCircle } from "lucide-react";
import { Button, Card, CardContent, Alert, Input } from "../UI";
import { useCart } from "../../hooks/useCart";
import { useAuthStore } from "../../store/useAuthStore";
import { useCheckoutCouponStore } from "../../store/useCheckoutCouponStore";
import { orderApi } from "../../api/order";
import { apiErrorUtils } from "../../utils/api-errors";
import { formatPrice } from "../../lib/productUtils";
import { cn } from "../../lib/utils";

interface CartSummaryProps {
  className?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ className }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    totalItems,
    subtotal,
    shipping,
    flatRate,
    availableItems,
  } = useCart();

  const appliedCoupon = useCheckoutCouponStore((s) => s.appliedCoupon);
  const pricingSnapshot = useCheckoutCouponStore((s) => s.pricingSnapshot);
  const setPersistedCoupon = useCheckoutCouponStore((s) => s.setPersistedCoupon);
  const clearPersistedCoupon = useCheckoutCouponStore((s) => s.clearPersistedCoupon);

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isPromoApplying, setIsPromoApplying] = useState(false);
  const [isPromoRemoving, setIsPromoRemoving] = useState(false);

  const cartLineSubtotal = subtotal;
  const merchandiseSubtotal =
    pricingSnapshot?.payableSubtotal ?? cartLineSubtotal;
  const displayTotal = merchandiseSubtotal + shipping + flatRate;
  const discountBannerAmount = pricingSnapshot?.discountAmount ?? 0;
  const promoApplied = Boolean(appliedCoupon);

  useEffect(() => {
    if (!appliedCoupon || !pricingSnapshot) return;
    const drift = Math.abs(
      cartLineSubtotal - pricingSnapshot.preDiscountSubtotal
    );
    if (drift <= 1) return;
    clearPersistedCoupon();
    setPromoCode("");
    setPromoError(
      "Cart changed — please re-apply your coupon if you still want the discount."
    );
  }, [appliedCoupon, pricingSnapshot, cartLineSubtotal, clearPersistedCoupon]);

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const handleApplyPromo = async () => {
    const trimmed = promoCode.trim();
    setPromoError(null);
    if (!trimmed) {
      setPromoError("Please enter a promo code");
      return;
    }

    if (availableItems.length === 0) {
      setPromoError("Add items to your cart before applying a promo code.");
      return;
    }

    if (!isAuthenticated) {
      setPersistedCoupon(trimmed, null);
      setPromoError(null);
      return;
    }

    setIsPromoApplying(true);
    try {
      const snapshot = await orderApi.applyCoupon(trimmed);
      setPersistedCoupon(trimmed, snapshot);
      setPromoError(null);
    } catch (e) {
      clearPersistedCoupon();
      setPromoError(apiErrorUtils.getErrorMessage(e));
    } finally {
      setIsPromoApplying(false);
    }
  };

  const handleRemovePromo = async () => {
    setPromoError(null);
    if (!isAuthenticated) {
      clearPersistedCoupon();
      setPromoCode("");
      return;
    }

    setIsPromoRemoving(true);
    try {
      await orderApi.removeCoupon();
      clearPersistedCoupon();
      setPromoCode("");
    } catch (e) {
      setPromoError(apiErrorUtils.getErrorMessage(e));
    } finally {
      setIsPromoRemoving(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
              </span>
              <span className="font-medium">{formatPrice(merchandiseSubtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {shipping === 0 ? (
                  <span className="text-yellow-600">Incoming</span>
                ) : (
                  formatPrice(shipping)
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Flat Rate</span>
              <span className="font-medium">{formatPrice(flatRate)}</span>
            </div>

            <hr className="border-gray-200" />

            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-lg text-gray-900">
                {formatPrice(displayTotal)}
              </span>
            </div>
          </div>

          {cartLineSubtotal < 50000 && (
            <Alert className="mt-4">
              <Truck className="w-4 h-4" />
              <div>
                <p className="text-sm">
                  Add {formatPrice(50000 - cartLineSubtotal)} more for free shipping!
                </p>
              </div>
            </Alert>
          )}

          <Button
            onClick={handleCheckout}
            className="w-full mt-6"
            size="lg"
            disabled={availableItems.length === 0}
          >
            Proceed to checkout
          </Button>

          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Secure checkout</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Shipping & Returns</h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Free Shipping</p>
                <p className="text-gray-600">On orders over ₦50,000</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RotateCcw className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Easy Returns</p>
                <p className="text-gray-600">30-day return policy</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Secure Payment</p>
                <p className="text-gray-600">Your payment info is safe</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Promo Code</h3>
          {!promoApplied ? (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    if (promoError) setPromoError(null);
                  }}
                  className={cn(promoError && "border-red-300")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleApplyPromo();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleApplyPromo()}
                  disabled={
                    !promoCode.trim() ||
                    isPromoApplying ||
                    availableItems.length === 0
                  }
                >
                  {isPromoApplying ? "Applying…" : "Apply"}
                </Button>
              </div>

              {promoError && (
                <div className="mt-2 flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{promoError}</span>
                </div>
              )}

              {!isAuthenticated && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Sign in to validate this code against your cart. As a guest, the
                  code is saved and sent when you place your order.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                <span className="text-sm font-medium text-green-800 truncate">
                  Promo code &quot;{appliedCoupon}&quot; applied
                </span>
                {discountBannerAmount > 0 && (
                  <span className="text-sm text-green-600 shrink-0">
                    (-{formatPrice(discountBannerAmount)})
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleRemovePromo()}
                disabled={isPromoRemoving}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
              >
                {isPromoRemoving ? "Removing…" : "Remove"}
              </Button>
            </div>
          )}

          {!promoApplied && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Try these codes:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPromoCode("SAVE10")}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  SAVE10
                </button>
                <button
                  type="button"
                  onClick={() => setPromoCode("FREESHIP")}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  FREESHIP
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CartSummary;
