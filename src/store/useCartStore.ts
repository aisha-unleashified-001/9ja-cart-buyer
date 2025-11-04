import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getSubtotal: () => number;
  getShipping: () => number;
  getTax: () => number;
  getFinalTotal: () => number;
  isItemInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id);
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            };
          }
          
          return {
            items: [...state.items, { id: product.id, product, quantity }]
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId)
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        }));
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = typeof item.product.price === 'number' ? item.product.price : item.product.price.current;
          return total + (price * item.quantity);
        }, 0);
      },

      getSubtotal: () => {
        return get().getTotalPrice();
      },

      getShipping: () => {
        const subtotal = get().getSubtotal();
        return subtotal > 50000 ? 0 : 2500; // Free shipping over ₦50,000
      },

      getTax: () => {
        const subtotal = get().getSubtotal();
        return subtotal * 0.08; // 8% tax
      },

      getFinalTotal: () => {
        const subtotal = get().getSubtotal();
        const shipping = get().getShipping();
        const tax = get().getTax();
        return subtotal + shipping + tax;
      },

      isItemInCart: (productId: string) => {
        return get().items.some(item => item.product.id === productId);
      },

      getItemQuantity: (productId: string) => {
        const item = get().items.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);