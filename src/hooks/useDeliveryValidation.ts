import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CartItem } from "../types";
import {
  orderApi,
  parseValidateDeliveryResponse,
  expandCartItemsForValidateDelivery,
  type NormalizedDeliveryValidation,
} from "../api/order";
import { apiErrorUtils } from "../utils/api-errors";

type UseDeliveryValidationOptions = {
  buyerAddress: string;
  cartLineItems: CartItem[];
  /** When false, clears validation and skips requests. */
  enabled: boolean;
  debounceMs?: number;
};

/**
 * Calls POST /order/checkout/validate-delivery when address + cart change
 * so mixed / non-Lagos items can be flagged on cart and checkout.
 */
export function useDeliveryValidation({
  buyerAddress,
  cartLineItems,
  enabled,
  debounceMs = 400,
}: UseDeliveryValidationOptions) {
  const [validation, setValidation] = useState<NormalizedDeliveryValidation | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const itemsRef = useRef(cartLineItems);
  itemsRef.current = cartLineItems;

  const cartFingerprint = useMemo(
    () =>
      [...cartLineItems]
        .map((i) => `${i.product.id}:${i.quantity}`)
        .sort()
        .join("|"),
    [cartLineItems]
  );

  const runValidate = useCallback(async () => {
    const items = itemsRef.current;
    const addr = buyerAddress.trim();
    if (!addr || items.length === 0) {
      setValidation(null);
      setError(null);
      return;
    }
    const cartItems = expandCartItemsForValidateDelivery(items);
    if (cartItems.length === 0) {
      setValidation(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const raw = await orderApi.validateDelivery({ buyerAddress: addr, cartItems });
      setValidation(parseValidateDeliveryResponse(raw));
    } catch (e) {
      setError(apiErrorUtils.getErrorMessage(e));
      // Preserve last successful validation to avoid UI regressions on transient API timeouts.
      setValidation((prev) => prev);
    } finally {
      setIsLoading(false);
    }
  }, [buyerAddress]);

  useEffect(() => {
    if (!enabled || !buyerAddress.trim() || cartFingerprint.length === 0) {
      setValidation(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const t = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const items = itemsRef.current;
        const cartItems = expandCartItemsForValidateDelivery(items);
        if (cartItems.length === 0) {
          if (!cancelled) {
            setValidation(null);
            setIsLoading(false);
          }
          return;
        }
        const raw = await orderApi.validateDelivery({
          buyerAddress: buyerAddress.trim(),
          cartItems,
        });
        if (cancelled) return;
        setValidation(parseValidateDeliveryResponse(raw));
      } catch (e) {
        if (cancelled) return;
        setError(apiErrorUtils.getErrorMessage(e));
        // Keep previously validated state when refresh fails transiently.
        setValidation((prev) => prev);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [buyerAddress, cartFingerprint, enabled, debounceMs]);

  const refresh = useCallback(() => runValidate(), [runValidate]);

  return { validation, error, isLoading, refresh };
}
