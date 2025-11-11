import { apiClient } from './client';

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
}

export interface CheckoutRequest {
  billing: BillingDetails;
  orderItems: OrderItem[];
  paymentMethod: string;
  couponCode?: string;
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

export interface CheckoutResponse {
  status: number;
  error: boolean;
  message: string;
  data?: OrderData;
}

// Order API endpoints
export const orderApi = {
  // Place order (requires Bearer token)
  checkout: async (orderData: CheckoutRequest): Promise<CheckoutResponse> => {
    return apiClient.post<CheckoutResponse>('/order/checkout', orderData, undefined, true);
  },
};

// Helper functions for data transformation
export const transformBillingDetails = (billingForm: any): BillingDetails => ({
  firstName: billingForm.lastName 
    ? `${billingForm.firstName} ${billingForm.lastName}`.trim()
    : billingForm.firstName,
  companyName: billingForm.companyName || '',
  streetAddress: billingForm.streetAddress,
  apartment: billingForm.apartment || '',
  city: billingForm.townCity, // Note: townCity → city mapping
  phoneNumber: billingForm.phoneNumber,
  emailAddress: billingForm.emailAddress,
});

export const transformCartItemsToOrderItems = (cartItems: any[]): OrderItem[] => {
  return cartItems.map(item => ({
    productId: item.product.id,
    vendor: item.vendor || '', // Use server vendor or empty string
    quantity: item.quantity,
    price: item.price || (typeof item.product.price === 'number' 
      ? item.product.price 
      : item.product.price.current),
  }));
};

export const mapPaymentMethodToApi = (uiPaymentMethod: string): string => {
  const paymentMethodMap: Record<string, string> = {
    'bank-card': 'card',
    'cash-on-delivery': 'cod',
    'buy-now-pay-later': 'bnpl',
    'emergency-credit': 'credit',
  };
  
  return paymentMethodMap[uiPaymentMethod] || uiPaymentMethod;
};