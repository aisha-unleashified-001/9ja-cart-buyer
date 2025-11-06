import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useNotificationContext } from '../providers/NotificationProvider';
import type { Product } from '../types';

/**
 * Clean cart hook that handles both guest and authenticated users
 * Automatically switches behavior based on authentication state
 */
export const useCart = () => {
  const { isAuthenticated } = useAuthStore();
  const { showNotification } = useNotificationContext();
  const {
    guestItems,
    serverItems,
    isOpen,
    isLoading,
    error,
    addItem: storeAddItem,
    removeItem: storeRemoveItem,
    updateQuantity: storeUpdateQuantity,
    clearCart: storeClearCart,
    toggleCart,
    getItems,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    getShipping,
    getTax,
    getFinalTotal,
    isItemInCart,
    getItemQuantity,
  } = useCartStore();

  // Wrapper methods that automatically pass authentication state
  const addToCart = async (product: Product, quantity = 1) => {
    await storeAddItem(product, quantity, isAuthenticated);
    
    // Show notification for guest users
    if (!isAuthenticated) {
      showNotification('Sign in to save your cart', 'info', 4000);
    }
  };

  const removeFromCart = async (productId: string) => {
    await storeRemoveItem(productId, isAuthenticated);
  };

  const updateItemQuantity = async (productId: string, quantity: number) => {
    await storeUpdateQuantity(productId, quantity, isAuthenticated);
  };

  const clearAllItems = async () => {
    await storeClearCart(isAuthenticated);
  };

  // Computed values
  const items = getItems(isAuthenticated);
  const totalItems = getTotalItems(isAuthenticated);
  const totalPrice = getTotalPrice(isAuthenticated);
  const subtotal = getSubtotal(isAuthenticated);
  const shipping = getShipping(isAuthenticated);
  const tax = getTax(isAuthenticated);
  const finalTotal = getFinalTotal(isAuthenticated);

  const isInCart = (productId: string) => isItemInCart(productId, isAuthenticated);
  const getQuantity = (productId: string) => getItemQuantity(productId, isAuthenticated);

  // Cart summary for backward compatibility
  const getCartSummary = () => ({
    subtotal,
    shipping,
    tax,
    total: finalTotal,
    itemCount: totalItems,
    formattedSubtotal: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(subtotal),
    formattedShipping: new Intl.NumberFormat("en-NG", {
      style: "currency", 
      currency: "NGN",
    }).format(shipping),
    formattedTotal: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN", 
    }).format(finalTotal),
  });

  return {
    // Data
    items,
    totalItems,
    totalPrice,
    subtotal,
    shipping,
    tax,
    finalTotal,
    
    // State
    isOpen,
    isLoading,
    isOperating: isLoading, // Alias for backward compatibility
    error,
    isAuthenticated,
    
    // Actions
    addToCart,
    removeFromCart,
    updateItemQuantity,
    updateCartItemQuantity: updateItemQuantity, // Alias for backward compatibility
    clearAllItems,
    toggleCart,
    
    // Utilities
    isInCart,
    getQuantity,
    getCartSummary,
    
    // Raw data for debugging
    guestItems,
    serverItems,
  };
};