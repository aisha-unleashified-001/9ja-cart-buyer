/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

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

// Order API endpoints
export const orderApi = {
  // Place order (requires Bearer token)
  checkout: async (orderData: CheckoutRequest): Promise<CheckoutResponse> => {
    return apiClient.post<CheckoutResponse>(
      "/order/checkout",
      orderData,
      undefined,
      true
    );
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
  return cartItems.map((item) => ({
    productId: item.product.id,
    vendor: item.vendor || "", // Use server vendor or empty string
    quantity: item.quantity,
    price:
      item.price ||
      (typeof item.product.price === "number"
        ? item.product.price
        : item.product.price.current),
  }));
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
