import { useCartStore } from '../store/useCartStore';
import type { Product } from '../types';

export const useCart = () => {
  const store = useCartStore();

  const addToCart = (product: Product, quantity: number = 1) => {
    store.addItem(product, quantity);
    
    // You could add toast notifications here
    // toast.success(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId: string) => {
    store.removeItem(productId);
    
    // You could add toast notifications here
    // toast.success('Item removed from cart');
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    store.updateQuantity(productId, quantity);
  };

  const clearAllItems = () => {
    store.clearCart();
    
    // You could add toast notifications here
    // toast.success('Cart cleared');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  const getCartSummary = () => {
    const subtotal = store.getSubtotal();
    const shipping = store.getShipping();
    const tax = store.getTax();
    const total = store.getFinalTotal();
    const itemCount = store.getTotalItems();

    return {
      subtotal,
      shipping,
      tax,
      total,
      itemCount,
      formattedSubtotal: formatPrice(subtotal),
      formattedShipping: shipping === 0 ? 'Free' : formatPrice(shipping),
      formattedTax: formatPrice(tax),
      formattedTotal: formatPrice(total),
      hasItems: itemCount > 0,
      qualifiesForFreeShipping: subtotal >= 50000,
      amountForFreeShipping: Math.max(0, 50000 - subtotal)
    };
  };

  return {
    // State
    items: store.items,
    isOpen: store.isOpen,
    
    // Actions
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearAllItems,
    toggleCart: store.toggleCart,
    
    // Computed values
    totalItems: store.getTotalItems(),
    totalPrice: store.getTotalPrice(),
    isItemInCart: store.isItemInCart,
    getItemQuantity: store.getItemQuantity,
    
    // Helpers
    formatPrice,
    getCartSummary,
    
    // Raw store methods (for advanced usage)
    store
  };
};

export default useCart;