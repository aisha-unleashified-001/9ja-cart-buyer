import { apiClient } from './client';

// Cart API request types
export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartRequest {
  cartItemId: string;
  quantity: number;
}

export interface RemoveFromCartRequest {
  cartItemId: string;
}

// Cart API response types (matching backend structure)
export interface ApiCartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  vendor: string;
  quantity: string; // Backend returns as string
  price: number;
  subtotal: number;
  addedAt: string;
  productImages: string[];
}

export interface ApiCartSummary {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface CartViewResponse {
  status: number;
  error: boolean;
  message: string;
  data: {
    items: ApiCartItem[];
    summary: ApiCartSummary;
  };
}

export interface CartActionResponse {
  status: number;
  error: boolean;
  message: string;
  data?: any;
}

// Cart API endpoints
export const cartApi = {
  // Add item to cart (requires Bearer token)
  addItem: async (data: AddToCartRequest): Promise<CartActionResponse> => {
    return apiClient.post<CartActionResponse>('/order/cart/add', data, undefined, true);
  },

  // Get cart contents (requires Bearer token)
  getCart: async (): Promise<CartViewResponse> => {
    return apiClient.get<CartViewResponse>('/order/cart/view', undefined, true);
  },

  // Update cart item quantity (requires Bearer token)
  updateItem: async (data: UpdateCartRequest): Promise<CartActionResponse> => {
    return apiClient.put<CartActionResponse>('/order/cart/update', data, undefined, true);
  },

  // Remove item from cart (requires Bearer token)
  removeItem: async (data: RemoveFromCartRequest): Promise<CartActionResponse> => {
    return apiClient.delete<CartActionResponse>('/order/cart/remove', {
      // No additional data needed
      body: JSON.stringify(data),
    }, true);
  },

  // Clear entire cart (requires Bearer token)
  clearCart: async (): Promise<CartActionResponse> => {
    return apiClient.delete<CartActionResponse>('/order/cart/clear', undefined, true);
  },
};