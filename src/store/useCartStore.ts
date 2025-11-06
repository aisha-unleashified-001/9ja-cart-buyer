import { create } from 'zustand';
import type { Product, CartItem } from '../types';
import { cartApi, type ApiCartItem } from '../api/cart';
import { apiErrorUtils } from '../utils/api-errors';

interface CartStore {
  // Guest cart data (in-memory only)
  guestItems: CartItem[];
  
  // Authenticated cart data (from server)
  serverItems: CartItem[];
  
  // UI state
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Core methods
  addItem: (product: Product, quantity?: number, isAuthenticated?: boolean) => Promise<void>;
  removeItem: (productId: string, isAuthenticated?: boolean) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, isAuthenticated?: boolean) => Promise<void>;
  clearCart: (isAuthenticated?: boolean) => Promise<void>;
  
  // Authentication methods
  loadServerCart: () => Promise<void>;
  migrateGuestCartOnLogin: () => Promise<void>;
  clearGuestCart: () => void;
  handleLogout: () => void;
  
  // Utility methods
  toggleCart: () => void;
  getItems: (isAuthenticated: boolean) => CartItem[];
  getTotalItems: (isAuthenticated: boolean) => number;
  getTotalPrice: (isAuthenticated: boolean) => number;
  getSubtotal: (isAuthenticated: boolean) => number;
  getShipping: (isAuthenticated: boolean) => number;
  getTax: (isAuthenticated: boolean) => number;
  getFinalTotal: (isAuthenticated: boolean) => number;
  isItemInCart: (productId: string, isAuthenticated: boolean) => boolean;
  getItemQuantity: (productId: string, isAuthenticated: boolean) => number;
  
  // Internal helpers
  _mapApiItemToCartItem: (apiItem: ApiCartItem, product?: Product) => CartItem;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  // Initial state
  guestItems: [],
  serverItems: [],
  isOpen: false,
  isLoading: false,
  error: null,

  // Helper to map API items to cart items
  _mapApiItemToCartItem: (apiItem: ApiCartItem, product?: Product): CartItem => {
    return {
      id: apiItem.productId,
      cartItemId: apiItem.cartItemId,
      product: product || {
        id: apiItem.productId,
        name: apiItem.productName,
        slug: apiItem.productId,
        sku: apiItem.productId,
        categoryId: 'unknown',
        tags: [],
        description: '',
        images: { 
          main: apiItem.productImages[0] || '', 
          gallery: apiItem.productImages, 
          alt: apiItem.productName 
        },
        price: { 
          current: apiItem.price, 
          currency: 'NGN' 
        },
        reviews: {
          average: 0,
          total: 0
        },
        inventory: {
          inStock: true,
          status: 'in_stock' as const,
          trackQuantity: false
        },
        shipping: {
          freeShipping: false
        },
        returns: {
          returnable: true,
          period: 30,
          unit: 'days' as const,
          free: false
        },
        status: 'active' as const,
        flags: {
          featured: false,
          newArrival: false,
          bestseller: false
        },
        sellerId: apiItem.vendor,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Product,
      quantity: parseInt(apiItem.quantity),
      vendor: apiItem.vendor,
      price: apiItem.price,
      subtotal: apiItem.subtotal,
      addedAt: apiItem.addedAt,
      productImages: apiItem.productImages,
    };
  },

  // Add item - different behavior for guest vs authenticated users
  addItem: async (product: Product, quantity = 1, isAuthenticated = false) => {
    set({ error: null });

    if (isAuthenticated) {
      // Authenticated: Call API directly
      try {
        set({ isLoading: true });
        await cartApi.addItem({
          productId: product.id,
          quantity: quantity
        });
        
        // Reload cart from server to get updated state
        await get().loadServerCart();
      } catch (error) {
        const errorMessage = apiErrorUtils.getErrorMessage(error);
        set({ error: errorMessage });
        throw new Error(errorMessage);
      } finally {
        set({ isLoading: false });
      }
    } else {
      // Guest: Update in-memory state only
      const { guestItems } = get();
      const existingItem = guestItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        set((state) => ({
          guestItems: state.guestItems.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }));
      } else {
        const newItem: CartItem = {
          id: product.id,
          product,
          quantity
        };
        set((state) => ({
          guestItems: [...state.guestItems, newItem]
        }));
      }
    }
  },

  // Remove item - different behavior for guest vs authenticated users
  removeItem: async (productId: string, isAuthenticated = false) => {
    set({ error: null });

    if (isAuthenticated) {
      // Authenticated: Call API directly
      try {
        set({ isLoading: true });
        const { serverItems } = get();
        const item = serverItems.find(item => item.product.id === productId);
        
        if (item?.cartItemId) {
          await cartApi.removeItem({
            cartItemId: item.cartItemId
          });
          
          // Reload cart from server to get updated state
          await get().loadServerCart();
        }
      } catch (error) {
        const errorMessage = apiErrorUtils.getErrorMessage(error);
        set({ error: errorMessage });
        throw new Error(errorMessage);
      } finally {
        set({ isLoading: false });
      }
    } else {
      // Guest: Update in-memory state only
      set((state) => ({
        guestItems: state.guestItems.filter(item => item.product.id !== productId)
      }));
    }
  },

  // Update quantity - different behavior for guest vs authenticated users
  updateQuantity: async (productId: string, quantity: number, isAuthenticated = false) => {
    if (quantity <= 0) {
      await get().removeItem(productId, isAuthenticated);
      return;
    }

    set({ error: null });

    if (isAuthenticated) {
      // Authenticated: Call API directly
      try {
        set({ isLoading: true });
        const { serverItems } = get();
        const item = serverItems.find(item => item.product.id === productId);
        
        if (item?.cartItemId) {
          await cartApi.updateItem({
            cartItemId: item.cartItemId,
            quantity: quantity
          });
          
          // Reload cart from server to get updated state
          await get().loadServerCart();
        }
      } catch (error) {
        const errorMessage = apiErrorUtils.getErrorMessage(error);
        set({ error: errorMessage });
        throw new Error(errorMessage);
      } finally {
        set({ isLoading: false });
      }
    } else {
      // Guest: Update in-memory state only
      set((state) => ({
        guestItems: state.guestItems.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
      }));
    }
  },

  // Clear cart - different behavior for guest vs authenticated users
  clearCart: async (isAuthenticated = false) => {
    set({ error: null });

    if (isAuthenticated) {
      // Authenticated: Call API directly
      try {
        set({ isLoading: true });
        await cartApi.clearCart();
        set({ serverItems: [] });
      } catch (error) {
        const errorMessage = apiErrorUtils.getErrorMessage(error);
        set({ error: errorMessage });
        throw new Error(errorMessage);
      } finally {
        set({ isLoading: false });
      }
    } else {
      // Guest: Clear in-memory state only
      set({ guestItems: [] });
    }
  },

  // Load cart from server (for authenticated users)
  loadServerCart: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await cartApi.getCart();
      
      if (response.data) {
        const { items: apiItems } = response.data;
        
        // Map API items to cart items
        const cartItems = apiItems.map(apiItem => get()._mapApiItemToCartItem(apiItem));
        
        set({
          serverItems: cartItems,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to load server cart:', error);
      set({ 
        isLoading: false, 
        error: apiErrorUtils.getErrorMessage(error)
      });
    }
  },

  // Migrate guest cart to server on login
  migrateGuestCartOnLogin: async () => {
    const { guestItems } = get();
    
    console.log('🔄 Starting cart migration. Guest items:', guestItems.length);
    
    if (guestItems.length === 0) {
      // No guest cart to migrate, just load server cart
      console.log('📦 No guest items, loading server cart...');
      await get().loadServerCart();
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      console.log('📤 Migrating guest cart items to server...');
      // Add each guest cart item to server
      for (const item of guestItems) {
        try {
          console.log(`📤 Migrating: ${item.product.name} (qty: ${item.quantity})`);
          await cartApi.addItem({
            productId: item.product.id,
            quantity: item.quantity
          });
        } catch (error) {
          console.error(`❌ Failed to migrate ${item.product.name}:`, error);
          // Continue with other items
        }
      }
      
      console.log('📥 Loading merged cart from server...');
      // Load the merged cart from server
      await get().loadServerCart();
      
      // Clear guest cart after successful migration
      set({ guestItems: [] });
      
      console.log('✅ Cart migration completed successfully');
    } catch (error) {
      console.error('❌ Failed to migrate guest cart:', error);
      set({ 
        isLoading: false, 
        error: apiErrorUtils.getErrorMessage(error)
      });
    }
  },

  // Clear guest cart (helper method)
  clearGuestCart: () => {
    set({ guestItems: [] });
  },

  // Handle logout - clear server data, keep guest cart empty
  handleLogout: () => {
    set({
      serverItems: [],
      guestItems: [], // Start fresh as guest
      isLoading: false,
      error: null
    });
  },

  // UI methods
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  // Get items based on auth state
  getItems: (isAuthenticated: boolean) => {
    const { guestItems, serverItems } = get();
    return isAuthenticated ? serverItems : guestItems;
  },

  // Calculation methods
  getTotalItems: (isAuthenticated: boolean) => {
    const items = get().getItems(isAuthenticated);
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: (isAuthenticated: boolean) => {
    const items = get().getItems(isAuthenticated);
    return items.reduce((total, item) => {
      const price = typeof item.product.price === 'number' ? item.product.price : item.product.price.current;
      return total + (price * item.quantity);
    }, 0);
  },

  getSubtotal: (isAuthenticated: boolean) => {
    return get().getTotalPrice(isAuthenticated);
  },

  getShipping: (isAuthenticated: boolean) => {
    const subtotal = get().getSubtotal(isAuthenticated);
    return subtotal > 50000 ? 0 : 2500; // Free shipping over ₦50,000
  },

  getTax: (isAuthenticated: boolean) => {
    const subtotal = get().getSubtotal(isAuthenticated);
    return subtotal * 0.08; // 8% tax
  },

  getFinalTotal: (isAuthenticated: boolean) => {
    const subtotal = get().getSubtotal(isAuthenticated);
    const shipping = get().getShipping(isAuthenticated);
    const tax = get().getTax(isAuthenticated);
    return subtotal + shipping + tax;
  },

  isItemInCart: (productId: string, isAuthenticated: boolean) => {
    const items = get().getItems(isAuthenticated);
    return items.some(item => item.product.id === productId);
  },

  getItemQuantity: (productId: string, isAuthenticated: boolean) => {
    const items = get().getItems(isAuthenticated);
    const item = items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  },
}));