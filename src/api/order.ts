/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";
import type { RateOrderRequest, RateOrderResponse, GetOrderRatingsResponse } from "../types";

// Order API request types
export interface BillingDetails {
  firstName: string;
  companyName: string;
  streetAddress: string;
  apartment: string;
  city: string;
  phoneNumber: string;
  emailAddress: string;
}

export interface OrderItem {
  productId: string;
  vendor: string;
  quantity: number;
  price: number;
  variations?: Array<{
    name: string;
    value: string;
  }>;
}

export interface CheckoutRequest {
  billing: BillingDetails;
  orderItems: OrderItem[];
  paymentMethod: string;
  couponCode?: string;
  guestCheckout?: number;
  createAccount?: number;
  password?: string;
  buyerId?: string;
}

// Order API response types
export interface OrderData {
  orderId: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  status: string;
  paymentMethod: string;
  estimatedDelivery?: string;
  createdAt: string;
}

export interface paymentData {
  authorizationUrl: string;
}

export interface CheckoutResponse {
  orderNo: string;
  paymentData: paymentData;
  redirectUrl: string
  status: number;
  error: boolean;
  message: string;
  data?: OrderData;
}

/** POST /order/checkout/validate-delivery */
export interface ValidateDeliveryCartItem {
  productId: string;
}

export interface ValidateDeliveryRequest {
  buyerAddress: string;
  cartItems: ValidateDeliveryCartItem[];
}

/**
 * Builds a stable fingerprint for validate-delivery payloads so we can
 * dedupe identical in-flight requests across hook + manual trigger paths.
 */
export function getValidateDeliveryRequestKey(body: ValidateDeliveryRequest): string {
  const normalizedAddress = body.buyerAddress.trim().toLowerCase();
  const counts: Record<string, number> = {};
  for (const item of body.cartItems) {
    const id = String(item.productId ?? "").trim();
    if (!id) continue;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  const normalizedItems = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, qty]) => `${id}:${qty}`)
    .join("|");
  return `${normalizedAddress}::${normalizedItems}`;
}

/** Single-flight cache for in-progress validate-delivery requests. */
const inFlightValidateDeliveryRequests = new Map<string, Promise<unknown>>();

export interface DeliveryOptionDto {
  id?: string;
  name?: string;
  provider?: string;
  price?: number;
  eta?: string;
  estimatedArrival?: string;
  estimatedDelivery?: string;
}

/** Normalized view of validate-delivery (backend field names may vary). */
export interface NormalizedDeliveryValidation {
  isMixedCart: boolean;
  manualDeliveryRequired: boolean;
  fullManualDelivery: boolean;
  partialManualDelivery: boolean;
  automatedDeliveryEligible: boolean;
  scenario?: string;
  deliveryMode?: string;
  automatedDeliveryFee?: number;
  /** Product IDs that must be removed from checkout for Lagos-only automated flow (non-Lagos vendor items). */
  affectedProductIds: string[];
  deliveryOptions: DeliveryOptionDto[];
  /** Best-effort Waka Line display when options list Lagos automated delivery. */
  wakaLine?: { price?: number; eta?: string; label?: string };
  raw: unknown;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** Laravel / JSON often sends 0/1 or "true" instead of booleans. */
function coerceBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "number" && Number.isFinite(v)) return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
  }
  return undefined;
}

function pickBool(o: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const k of keys) {
    if (!(k in o)) continue;
    const c = coerceBool(o[k]);
    if (c !== undefined) return c;
  }
  return undefined;
}

function productIdFromUnknown(el: unknown): string | undefined {
  if (typeof el === "string") return el;
  if (typeof el === "number" && Number.isFinite(el)) return String(el);
  if (!el || typeof el !== "object") return undefined;
  const obj = el as Record<string, unknown>;
  const nested = obj.product;
  const fromNested =
    nested && typeof nested === "object"
      ? (nested as Record<string, unknown>).id
      : undefined;
  const raw =
    obj.productId ??
    obj.product_id ??
    obj.id ??
    fromNested;
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return undefined;
}

/** Merge root JSON with common wrappers (`data`, `validation`, etc.) so flags parse reliably. */
function flattenApiEnvelope(payload: unknown): Record<string, unknown> {
  const root = asRecord(payload) ?? {};
  const merged: Record<string, unknown> = { ...root };

  const unwrap = (raw: unknown): Record<string, unknown> | null => {
    if (Array.isArray(raw) && raw[0] && typeof raw[0] === "object") {
      return asRecord(raw[0]);
    }
    return asRecord(raw);
  };

  const candidates: unknown[] = [
    root.data,
    root.result,
    root.Data,
    root.Result,
    root.validation,
    root.delivery,
    root.payload,
    root.body,
  ];

  for (const c of candidates) {
    const inner = unwrap(c);
    if (inner && Object.keys(inner).length > 0) {
      Object.assign(merged, inner);
    }
  }

  return merged;
}

function pickStringArray(o: Record<string, unknown>, keys: string[]): string[] {
  for (const k of keys) {
    const v = o[k];
    if (!Array.isArray(v)) continue;
    const out: string[] = [];
    for (const el of v) {
      const pid = productIdFromUnknown(el);
      if (pid) out.push(pid);
    }
    if (out.length) return out;
  }
  return [];
}

/**
 * Maps validate-delivery JSON to a stable shape. Safe on empty or unknown payloads.
 */
export function parseValidateDeliveryResponse(payload: unknown): NormalizedDeliveryValidation {
  const o = flattenApiEnvelope(payload);

  let isMixedCart =
    pickBool(o, [
      "isMixedCart",
      "mixedCart",
      "is_mixed_cart",
      "mixed",
      "isMixedDelivery",
      "mixedDelivery",
      "is_mixed_delivery",
      "hasMixedVendors",
      "cartHasMixedVendors",
      "mixedVendorCart",
    ]) ?? false;

  const modeStr = o.deliveryMode ?? o.delivery_mode ?? o.deliveryType ?? o.delivery_type;
  if (typeof modeStr === "string" && /mixed/i.test(modeStr)) {
    isMixedCart = true;
  }

  const manualDeliveryRequired =
    pickBool(o, [
      "manualDeliveryRequired",
      "manualRequired",
      "requiresManualDelivery",
      "manual_delivery_required",
      "isManualDelivery",
      "manualDelivery",
      "is_manual_delivery",
      "requiresManualHandling",
    ]) ?? false;

  const automatedDeliveryEligible =
    pickBool(o, [
      "automatedDeliveryEligible",
      "automatedEligible",
      "isAutomatedDelivery",
      "automated_delivery",
      "eligibleForAutomatedDelivery",
      "hasAutomatedDelivery",
      "automatedDeliveryAvailable",
    ]) ?? false;

  const affectedFromKeys = pickStringArray(o, [
    "affectedProductIds",
    "affected_product_ids",
    "nonLagosProductIds",
    "non_lagos_product_ids",
    "manualDeliveryProductIds",
    "itemsRequiringManualDelivery",
    "items_requiring_manual_delivery",
    "affectedItems",
    "affected_items",
    "itemsOutsideLagos",
    "items_outside_lagos",
    "outsideLagosItems",
    "manualItems",
    "nonLagosItems",
  ]);

  const affectedFromItems: string[] = [];
  const scanRowsForManual = (rows: unknown[]) => {
    for (const row of rows) {
      const r = asRecord(row);
      if (!r) continue;
      const manual =
        pickBool(r, [
          "requiresManualDelivery",
          "manualDelivery",
          "manual",
          "isManual",
          "outsideLagos",
          "isOutsideLagos",
        ]) ?? false;
      const pid = productIdFromUnknown(r);
      if (manual && pid) affectedFromItems.push(pid);
    }
  };

  if (!affectedFromKeys.length && Array.isArray(o.items)) {
    scanRowsForManual(o.items);
  }
  if (!affectedFromKeys.length && !affectedFromItems.length && Array.isArray(o.cartItems)) {
    scanRowsForManual(o.cartItems);
  }

  /** Some APIs nest line items under vendors. */
  if (
    !affectedFromKeys.length &&
    !affectedFromItems.length &&
    Array.isArray(o.vendors)
  ) {
    for (const v of o.vendors) {
      const vr = asRecord(v);
      if (!vr) continue;
      const isLagos = pickBool(vr, ["isLagos", "is_lagos", "lagosVendor"]);
      const region = vr.region ?? vr.state ?? vr.vendorState;
      const nonLagos =
        isLagos === false ||
        (typeof region === "string" && !/lagos/i.test(region));
      if (!nonLagos) continue;
      const vItems = vr.items ?? vr.cartItems;
      if (!Array.isArray(vItems)) continue;
      for (const row of vItems) {
        const pid = productIdFromUnknown(row);
        if (pid) affectedFromItems.push(pid);
      }
    }
  }

  const affectedProductIds = [...new Set([...affectedFromKeys, ...affectedFromItems])];

  let deliveryOptions: DeliveryOptionDto[] = [];
  const rawOpts =
    o.deliveryOptions ??
    o.options ??
    o.automatedDeliveryOptions ??
    o.automated_options ??
    o.automatedOptions ??
    o.deliveryProviders;
  if (Array.isArray(rawOpts)) {
    deliveryOptions = rawOpts.map((x) => {
      const r = asRecord(x) ?? {};
      const rawPrice = r.price ?? r.amount ?? r.cost ?? r.deliveryFee;
      let price: number | undefined;
      if (typeof rawPrice === "number" && Number.isFinite(rawPrice)) price = rawPrice;
      else if (typeof rawPrice === "string") {
        const n = parseFloat(rawPrice.replace(/[^0-9.-]/g, ""));
        if (Number.isFinite(n)) price = n;
      }
      const eta =
        (typeof r.eta === "string" && r.eta) ||
        (typeof r.estimatedArrival === "string" && r.estimatedArrival) ||
        (typeof r.estimatedDelivery === "string" && r.estimatedDelivery) ||
        undefined;
      return {
        id: typeof r.id === "string" ? r.id : undefined,
        name: typeof r.name === "string" ? r.name : undefined,
        provider: typeof r.provider === "string" ? r.provider : undefined,
        price,
        eta,
        estimatedArrival:
          typeof r.estimatedArrival === "string" ? r.estimatedArrival : undefined,
        estimatedDelivery:
          typeof r.estimatedDelivery === "string" ? r.estimatedDelivery : undefined,
      };
    });
  }

  const wakaFromRoot = asRecord(o.wakaLine ?? o.waka_line);
  let wakaLine: NormalizedDeliveryValidation["wakaLine"];
  if (wakaFromRoot) {
    const wp = wakaFromRoot.price ?? wakaFromRoot.amount;
    let price: number | undefined;
    if (typeof wp === "number" && Number.isFinite(wp)) price = wp;
    else if (typeof wp === "string") {
      const n = parseFloat(wp.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(n)) price = n;
    }
    const eta =
      (typeof wakaFromRoot.eta === "string" && wakaFromRoot.eta) ||
      (typeof wakaFromRoot.estimatedArrival === "string" &&
        wakaFromRoot.estimatedArrival) ||
      undefined;
    wakaLine = {
      price,
      eta,
      label: typeof wakaFromRoot.label === "string" ? wakaFromRoot.label : "Waka Line",
    };
  } else {
    const wakaOpt = deliveryOptions.find(
      (d) =>
        (d.name && /waka/i.test(d.name)) ||
        (d.provider && /waka/i.test(d.provider))
    );
    if (wakaOpt) {
      wakaLine = {
        price: wakaOpt.price,
        eta: wakaOpt.eta ?? wakaOpt.estimatedArrival ?? wakaOpt.estimatedDelivery,
        label: wakaOpt.name ?? "Waka Line",
      };
    }
  }

  const partialManualDelivery = isMixedCart || (affectedProductIds.length > 0 && manualDeliveryRequired);
  const fullManualDelivery =
    manualDeliveryRequired && !isMixedCart && affectedProductIds.length === 0;
  const scenario =
    typeof o.scenario === "string" ? o.scenario : undefined;
  const deliveryMode =
    typeof o.deliveryMode === "string"
      ? o.deliveryMode
      : typeof o.delivery_mode === "string"
        ? o.delivery_mode
        : undefined;
  const automatedDeliveryFee =
    wakaLine?.price ??
    deliveryOptions.find((x) => typeof x.price === "number")?.price;

  return {
    isMixedCart,
    manualDeliveryRequired,
    fullManualDelivery,
    partialManualDelivery,
    automatedDeliveryEligible,
    scenario,
    deliveryMode,
    automatedDeliveryFee,
    affectedProductIds,
    deliveryOptions,
    wakaLine,
    raw: payload,
  };
}

/**
 * Mixed cart: some checkout products are flagged for manual/non-Lagos handling, but not all.
 * Used when the API omits `isMixedCart` but returns `affectedProductIds`.
 */
export function inferMixedDeliveryCase(
  affectedProductIds: string[],
  checkoutProductIds: string[]
): boolean {
  if (affectedProductIds.length === 0) return false;
  const uniqueCart = new Set(checkoutProductIds);
  const affectedInCart = affectedProductIds.filter((id) => uniqueCart.has(id));
  if (affectedInCart.length === 0) return false;
  return affectedInCart.length < uniqueCart.size;
}

/** One entry per unit, matching API examples that repeat productId by quantity. */
export function expandCartItemsForValidateDelivery(
  cartItems: Array<{ product: { id: string }; quantity: number }>
): ValidateDeliveryCartItem[] {
  const out: ValidateDeliveryCartItem[] = [];
  for (const line of cartItems) {
    const id = line.product?.id;
    if (!id) continue;
    const q = Math.max(0, Math.floor(Number(line.quantity) || 0));
    for (let i = 0; i < q; i++) {
      out.push({ productId: id });
    }
  }
  return out;
}

// Order Detail API response types
export interface OrderDetailItem {
  id?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
  vendor?: string;
}

export interface OrderDetailResponse {
  orderId?: string;
  orderNumber?: string;
  orderNo?: string;
  status: string;
  total: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  estimatedDelivery?: string;
  items: OrderDetailItem[];
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    street?: string;
    streetAddress?: string;
    city: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phoneNumber?: string;
    emailAddress?: string;
  };
  billingAddress?: {
    firstName?: string;
    lastName?: string;
    street?: string;
    streetAddress?: string;
    city: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phoneNumber?: string;
    emailAddress?: string;
  };
}

export interface OrderDetailApiResponse {
  status?: number;
  error?: boolean;
  message?: string;
  data?: OrderDetailResponse;
  // If the API returns the order directly
  orderId?: string;
  orderNumber?: string;
  orderNo?: string;
  total?: number;
  items?: OrderDetailItem[];
  [key: string]: any;
}

// Actual API Orders List response types (based on real API structure)
export interface ApiOrderItem {
  id?: string;
  orderNo?: string;
  productId: string;
  productName?: string;
  productImage?: string;
  productImages?: string[]; // Array of product image URLs
  quantity: number | string;
  price?: number | string;
  subtotal?: number | string;
  vendor?: string;
  [key: string]: any;
}

export interface ApiOrder {
  orderNo: string;
  totalAmount: string | number;
  subtotalAmount: string | number;
  discountAmount?: string | number;
  discountPercentage?: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt?: string;
  orderItems: ApiOrderItem[];
  // Billing fields
  billingName?: string;
  billingEmail?: string;
  billingPhone?: string;
  billingStreetAddress?: string;
  billingApartment?: string;
  billingCity?: string;
  billingCompanyName?: string;
  couponCode?: string | null;
  [key: string]: any;
}

export interface OrdersListApiResponse {
  status: number;
  error: boolean;
  message: string;
  data: ApiOrder[];
  [key: string]: any;
}

/** `data.cartSummary` from POST /order/apply-coupon (field names per backend). */
export interface ApplyCouponCartSummary {
  totalItems?: number;
  totalQuantity?: number;
  subtotal: number;
  discount: number;
  tax?: number;
  shipping?: number;
  total: number;
}

/**
 * Normalized pricing from apply-coupon. Backend uses `cartSummary.total` as the
 * post-discount merchandise total; that value is what checkout shows as "Subtotal".
 */
export interface CouponPricingSnapshot {
  payableSubtotal: number;
  discountAmount: number;
  preDiscountSubtotal: number;
}

function numFromUnknown(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Extracts cart totals from apply-coupon JSON. Returns null when `cartSummary` is missing.
 */
export function parseApplyCouponResponse(payload: unknown): CouponPricingSnapshot | null {
  const root = payload !== null && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : null;
  if (!root) return null;

  const dataRaw = root.data;
  const data =
    dataRaw !== null && typeof dataRaw === "object" && !Array.isArray(dataRaw)
      ? (dataRaw as Record<string, unknown>)
      : root;

  const csRaw = data.cartSummary;
  if (!csRaw || typeof csRaw !== "object" || Array.isArray(csRaw)) return null;
  const cs = csRaw as Record<string, unknown>;

  const total = numFromUnknown(cs.total);
  if (total === undefined) return null;

  const subtotal = numFromUnknown(cs.subtotal);
  const discountField = numFromUnknown(cs.discount) ?? 0;

  const couponRaw = data.coupon;
  const coupon =
    couponRaw !== null && typeof couponRaw === "object" && !Array.isArray(couponRaw)
      ? (couponRaw as Record<string, unknown>)
      : null;
  const discountFromCoupon = coupon ? numFromUnknown(coupon.discountAmount) : undefined;

  const discountAmount =
    discountField > 0 ? discountField : discountFromCoupon ?? 0;

  const preDiscountSubtotal =
    subtotal !== undefined ? subtotal : total + discountAmount;

  return {
    payableSubtotal: total,
    discountAmount,
    preDiscountSubtotal,
  };
}

// Order API endpoints
export const orderApi = {
  // Place order (authenticated) — backend uses Basic auth; guestCheckout must be 0.
  checkout: async (orderData: CheckoutRequest): Promise<CheckoutResponse> => {
    const payload: CheckoutRequest = {
      ...orderData,
      guestCheckout: 0,
    };
    return apiClient.post<CheckoutResponse>(
      "/order/checkout",
      payload,
      undefined,
      false
    );
  },

  /**
   * Guest checkout: same endpoint, Basic auth, guestCheckout: 1.
   */
  checkoutAsGuest: async (
    orderData: CheckoutRequest
  ): Promise<CheckoutResponse> => {
    // Backend requires explicit guestCheckout flag in payload.
    const guestPayload: CheckoutRequest = {
      ...orderData,
      guestCheckout: 1,
    };
    return apiClient.post<CheckoutResponse>(
      "/order/checkout",
      guestPayload,
      undefined,
      false
    );
  },

  /**
   * Pre-checkout delivery validation (Basic auth). Evaluates Lagos vs mixed cart and delivery options.
   */
  validateDelivery: async (
    body: ValidateDeliveryRequest
  ): Promise<unknown> => {
    const key = getValidateDeliveryRequestKey(body);
    const existing = inFlightValidateDeliveryRequests.get(key);
    if (existing) {
      return existing;
    }

    const req = apiClient
      .post<unknown>("/order/checkout/validate-delivery", body, undefined, false)
      .finally(() => {
        inFlightValidateDeliveryRequests.delete(key);
      });

    inFlightValidateDeliveryRequests.set(key, req);
    return req;
  },

  /**
   * Apply a coupon to the current cart/order context (Bearer). Success is HTTP 2xx; response body may be empty.
   */
  applyCoupon: async (couponCode: string): Promise<CouponPricingSnapshot | null> => {
    const raw = await apiClient.post<unknown>(
      "/order/apply-coupon",
      { couponCode: couponCode.trim() },
      undefined,
      true
    );
    return parseApplyCouponResponse(raw);
  },

  /**
   * Remove the applied coupon (Bearer). Response body may be empty.
   */
  removeCoupon: async (): Promise<void> => {
    await apiClient.delete<unknown>("/order/remove-coupon", undefined, true);
  },
  
  // Get order details (requires Bearer token)
  getOrderDetail: async (orderId: string): Promise<OrderDetailResponse> => {
    const response = await apiClient.get<any>(
      `/order/detail/${orderId}`,
      undefined,
      true
    );
    
    // Handle different response structures
    // The API might return the same structure as orders list (ApiOrder format)
    let orderData: any;
    
    if (response.data) {
      orderData = response.data;
    } else if (response.orderNo || response.orderItems) {
      // Direct ApiOrder format
      orderData = response;
    } else {
      // Try as OrderDetailResponse format
      orderData = response;
    }
    
    // Transform ApiOrder format to OrderDetailResponse if needed
    if (orderData.orderItems && !orderData.items) {
      return transformApiOrderToOrderDetailResponse(orderData);
    }
    
    // Ensure items array exists
    if (!orderData.items && !orderData.orderItems) {
      orderData.items = [];
    } else if (orderData.orderItems && !orderData.items) {
      // Transform orderItems to items
      orderData.items = orderData.orderItems.map((item: any) => {
        // Handle productImages array (from API) or single productImage
        const productImagesArray = item.productImages;
        const productImage = productImagesArray && Array.isArray(productImagesArray) && productImagesArray.length > 0
          ? productImagesArray[0] // Use first image from array
          : item.productImage || (item.product?.image) || (item.product?.images?.main) || '';
        
        return {
          id: item.id,
          productId: item.productId,
          productName: item.productName || (item.product?.name) || 'Product',
          productImage: productImage,
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : item.quantity,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          subtotal: typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : (item.subtotal || (item.price * item.quantity)),
          vendor: item.vendor,
        };
      });
    }
    
    // Ensure total is a number
    if (orderData.totalAmount && !orderData.total) {
      orderData.total = typeof orderData.totalAmount === 'string' 
        ? parseFloat(orderData.totalAmount) 
        : orderData.totalAmount;
    }
    
    // Ensure subtotal is a number
    if (orderData.subtotalAmount && !orderData.subtotal) {
      orderData.subtotal = typeof orderData.subtotalAmount === 'string' 
        ? parseFloat(orderData.subtotalAmount) 
        : orderData.subtotalAmount;
    }
    
    return orderData as OrderDetailResponse;
  },

  // Get user orders list (requires Bearer token)
  getOrders: async (): Promise<ApiOrder[]> => {
    const response = await apiClient.get<OrdersListApiResponse>(
      "/order",
      undefined,
      true
    );
    
    // Handle the actual API response structure
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Fallback: if response is an array directly
    if (Array.isArray(response)) {
      return response as ApiOrder[];
    }
    
    // Return empty array if no orders found
    return [];
  },

  // Rate order (requires Bearer token)
  rateOrder: async (ratingData: RateOrderRequest): Promise<RateOrderResponse> => {
    return apiClient.post<RateOrderResponse>(
      "/order/rate",
      ratingData,
      undefined,
      true
    );
  },

  // Rate order items (matches backend API format with orderNo and productId)
  rateOrderItems: async (orderNo: string, ratings: Array<{
    productId: string;
    vendorId: string;
    rating: number;
    comment?: string;
  }>): Promise<RateOrderResponse> => {
    return apiClient.post<RateOrderResponse>(
      "/order/rate",
      {
        orderNo,
        ratings,
      },
      undefined,
      true
    );
  },

  // Get order ratings (requires Bearer token)
  getOrderRatings: async (orderId: string): Promise<GetOrderRatingsResponse> => {
    return apiClient.get<GetOrderRatingsResponse>(
      `/order/${orderId}/ratings`,
      undefined,
      true
    );
  },

  // Get order items (requires Bearer token)
  getOrderItems: async (orderId: string): Promise<ApiOrderItem[]> => {
    const response = await apiClient.get<any>(
      `/order/${orderId}/items`,
      undefined,
      true
    );
    
    // Handle the actual API response structure with vendors
    if (response.data && response.data.vendors && Array.isArray(response.data.vendors)) {
      // Flatten the vendors/items structure into a single array
      const items: ApiOrderItem[] = [];
      response.data.vendors.forEach((vendor: any) => {
        if (vendor.items && Array.isArray(vendor.items)) {
          vendor.items.forEach((item: any) => {
            items.push({
              ...item,
              vendor: vendor.vendorId,
              vendorName: vendor.vendorName,
              orderNo: response.data.orderNo,
            });
          });
        }
      });
      return items;
    }
    
    // Fallback: Handle different response structures
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    if (Array.isArray(response)) {
      return response as ApiOrderItem[];
    }
    
    return [];
  },
};

// Helper functions for data transformation
export const transformBillingDetails = (billingForm: any): BillingDetails => ({
  firstName: billingForm.lastName
    ? `${billingForm.firstName} ${billingForm.lastName}`.trim()
    : billingForm.firstName,
  companyName: billingForm.companyName || "",
  streetAddress: billingForm.streetAddress,
  apartment: billingForm.apartment || "",
  city: billingForm.townCity, // Note: townCity → city mapping
  phoneNumber: billingForm.phoneNumber,
  emailAddress: billingForm.emailAddress,
});

export const transformCartItemsToOrderItems = (
  cartItems: any[]
): OrderItem[] => {
  return cartItems.map((item) => {
    const rawPrice =
      item.price ??
      (typeof item.product.price === "number"
        ? item.product.price
        : item.product.price.current);

    const numericPrice =
      typeof rawPrice === "string" ? parseFloat(rawPrice) : Number(rawPrice);

    const variations =
      item.selectedVariants && Object.keys(item.selectedVariants).length > 0
        ? Object.entries(item.selectedVariants).map(([key, value]) => {
            const lower = key.toLowerCase();
            const name =
              lower === "size"
                ? "Size"
                : lower === "color"
                  ? "Color"
                  : lower === "measurement"
                    ? "Measurement"
                    : key.charAt(0).toUpperCase() + key.slice(1);
            return { name, value: String(value) };
          })
        : undefined;

    return {
      productId: item.product.id,
      // Prefer server vendor; fallback to product seller to avoid empty vendor payloads.
      vendor: item.vendor || item.product?.sellerId || "",
      quantity: Number.isFinite(Number(item.quantity))
        ? Math.max(1, Math.trunc(Number(item.quantity)))
        : 1,
      // Payment provider/backend expects whole-number amount values.
      price: Number.isFinite(numericPrice) ? Math.round(numericPrice) : 0,
      ...(variations ? { variations } : {}),
    };
  });
};

export const mapPaymentMethodToApi = (uiPaymentMethod: string): string => {
  const paymentMethodMap: Record<string, string> = {
    "bank-card": "card",
    "cash-on-delivery": "cod",
    "buy-now-pay-later": "bnpl",
    "emergency-credit": "credit",
  };

  return paymentMethodMap[uiPaymentMethod] || uiPaymentMethod;
};

// Transform ApiOrder to OrderDetailResponse format
export const transformApiOrderToOrderDetailResponse = (apiOrder: ApiOrder): OrderDetailResponse => {
  // Transform orderItems to items format
  const items: OrderDetailItem[] = (apiOrder.orderItems || []).map((item) => {
    const quantity = typeof item.quantity === 'string' 
      ? parseInt(item.quantity, 10) 
      : item.quantity || 1;
    
    const price = typeof item.price === 'string' 
      ? parseFloat(item.price) 
      : (item.price || 0);
    
    const subtotal = typeof item.subtotal === 'string' 
      ? parseFloat(item.subtotal) 
      : (item.subtotal || price * quantity);
    
    const productName = (item as any).product?.name || 
                       (item as any).productName || 
                       (item as any).name || 
                       'Product';
    // Handle productImages array (from API) or single productImage
    const productImagesArray = (item as any).productImages;
    const productImage = productImagesArray && Array.isArray(productImagesArray) && productImagesArray.length > 0
      ? productImagesArray[0] // Use first image from array
      : (item as any).product?.image || 
        (item as any).product?.images?.main ||
        (item as any).productImage || 
        (item as any).image || 
        '';
    
    return {
      id: item.id,
      productId: item.productId,
      productName: productName,
      productImage: productImage,
      quantity: quantity,
      price: price,
      subtotal: subtotal,
      vendor: item.vendor,
    };
  });
  
  const total = typeof apiOrder.totalAmount === 'string' 
    ? parseFloat(apiOrder.totalAmount) 
    : apiOrder.totalAmount || 0;
  
  const subtotal = typeof apiOrder.subtotalAmount === 'string' 
    ? parseFloat(apiOrder.subtotalAmount) 
    : apiOrder.subtotalAmount || total;
  
  const discount = typeof apiOrder.discountAmount === 'string' 
    ? parseFloat(apiOrder.discountAmount) 
    : apiOrder.discountAmount || 0;
  
  // Transform billing address
  const billingName = apiOrder.billingName || '';
  const nameParts = billingName.split(' ');
  
  return {
    orderNo: apiOrder.orderNo,
    status: apiOrder.status,
    total: total,
    subtotal: subtotal,
    discount: discount,
    paymentMethod: apiOrder.paymentMethod,
    paymentStatus: apiOrder.paymentStatus,
    createdAt: apiOrder.createdAt,
    items: items,
    billingAddress: {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      streetAddress: apiOrder.billingStreetAddress || '',
      city: apiOrder.billingCity || '',
      phoneNumber: apiOrder.billingPhone || '',
      emailAddress: apiOrder.billingEmail || '',
    },
    shippingAddress: {
      streetAddress: apiOrder.billingStreetAddress || '',
      city: apiOrder.billingCity || '',
      phoneNumber: apiOrder.billingPhone || '',
      emailAddress: apiOrder.billingEmail || '',
    },
  };
};

// Transform ApiOrder to Order type for frontend use
export const transformApiOrderToOrder = (apiOrder: ApiOrder): any => {
  // Get order ID
  const orderId = apiOrder.orderNo || '';
  
  // Parse amounts (handle string or number)
  const total = typeof apiOrder.totalAmount === 'string' 
    ? parseFloat(apiOrder.totalAmount) 
    : apiOrder.totalAmount || 0;
  
  // Transform orderItems to CartItem[]
  const items = (apiOrder.orderItems || []).map((item) => {
    const quantity = typeof item.quantity === 'string' 
      ? parseInt(item.quantity, 10) 
      : item.quantity || 1;
    
    const price = typeof item.price === 'string' 
      ? parseFloat(item.price) 
      : (item.price || 0);
    
    // Try to get product name and image from various possible fields
    // Check for nested product object or direct fields
    const productName = (item as any).product?.name || 
                       (item as any).productName || 
                       (item as any).name || 
                       'Product';
    // Handle productImages array (from API) or single productImage
    const productImagesArray = (item as any).productImages;
    const productImage = productImagesArray && Array.isArray(productImagesArray) && productImagesArray.length > 0
      ? productImagesArray[0] // Use first image from array
      : (item as any).product?.image || 
        (item as any).product?.images?.main ||
        (item as any).productImage || 
        (item as any).image || 
        '';
    
    return {
      id: item.id || item.productId,
      product: {
        id: item.productId,
        name: productName,
        images: {
          main: productImage,
          alt: productName,
        },
        price: price,
      },
      quantity: quantity,
      price: price,
      subtotal: typeof item.subtotal === 'string' 
        ? parseFloat(item.subtotal) 
        : (item.subtotal || price * quantity),
      vendor: item.vendor,
    };
  });

  // Transform billing address from flat structure
  const billingName = apiOrder.billingName || '';
  const nameParts = billingName.split(' ');
  
  return {
    id: orderId,
    items,
    total: total,
    status: (apiOrder.status || 'pending').toLowerCase(),
    createdAt: apiOrder.createdAt,
    shippingAddress: {
      id: orderId,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      street: apiOrder.billingStreetAddress || '',
      city: apiOrder.billingCity || '',
      state: '',
      zipCode: '',
      country: 'Nigeria',
      isDefault: false,
    },
  };
};

// Transform OrderDetailResponse to Order type for frontend use (legacy support)
export const transformOrderDetailToOrder = (
  orderDetail: OrderDetailResponse
): any => {
  // Get order ID (handle different field names)
  const orderId = orderDetail.orderId || orderDetail.orderNumber || orderDetail.orderNo || '';
  
  // Transform items from OrderDetailItem[] to CartItem[]
  const items = orderDetail.items.map((item) => ({
    id: item.id || item.productId,
    product: {
      id: item.productId,
      name: item.productName,
      images: {
        main: item.productImage || '',
        alt: item.productName,
      },
      price: item.price,
    },
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
    vendor: item.vendor,
  }));

  // Transform shipping address
  const shippingAddress = orderDetail.shippingAddress || orderDetail.billingAddress || ({} as OrderDetailResponse['shippingAddress']);
  const firstName = shippingAddress?.firstName || '';
  const nameParts = firstName.split(' ');
  
  return {
    id: orderId,
    items,
    total: orderDetail.total,
    status: orderDetail.status?.toLowerCase() || 'pending',
    createdAt: orderDetail.createdAt,
    shippingAddress: {
      id: orderId, // Use orderId as address id
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      street: shippingAddress?.streetAddress || shippingAddress?.street || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      zipCode: shippingAddress?.zipCode || '',
      country: shippingAddress?.country || 'Nigeria',
      isDefault: false,
    },
  };
};
