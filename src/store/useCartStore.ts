import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '../types';
import { cartApi, type ApiCartItem } from '../api/cart';
import { productsApi } from '../api/products';
import { apiErrorUtils } from '../utils/api-errors';
import { ApiError } from '../api/client';

interface CartStore {
  // Guest cart data (persisted to localStorage)
  guestItems: CartItem[];
  
  // Authenticated cart data (from server)
  serverItems: CartItem[];
  
  // UI state
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Migration state
  isMigrating: boolean;
  
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

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  // Initial state
  guestItems: [],
  serverItems: [],
  isOpen: false,
  isLoading: false,
  error: null,
  isMigrating: false,

  // Helper to map API items to cart items
  _mapApiItemToCartItem: (apiItem: ApiCartItem, product?: Product): CartItem => {
    // Handle vendor - can be string or object
    const vendorId = typeof apiItem.vendor === 'string' 
      ? apiItem.vendor 
      : apiItem.vendor.vendorId;
    const storeName = typeof apiItem.vendor === 'string' 
      ? apiItem.vendor 
      : apiItem.vendor.storeName;
    
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
        sellerId: vendorId,
        storeName: storeName, // Use extracted storeName
        createdAt: new Date(),
        updatedAt: new Date()
      } as Product,
      quantity: parseInt(apiItem.quantity),
      vendor: vendorId, // Store vendorId as string
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
        
        // Verify each product exists and filter out deleted products
        const validCartItems: CartItem[] = [];
        const deletedProductIds: string[] = [];
        
        // Check each cart item's product
        for (const apiItem of apiItems) {
          try {
            // Try to fetch the product to verify it exists
            const productResponse = await productsApi.getProduct(apiItem.productId);
            
            // Check if product actually exists
            // Backend returns status 200 with message "No product found." and empty data array when product doesn't exist
            const responseData = productResponse.data;
            const isProductDeleted = 
              // Check for empty array (API returns data: [] when product doesn't exist)
              (Array.isArray(responseData) && responseData.length === 0) ||
              // Check for null/undefined data
              !responseData ||
              // Check for message indicating product not found
              productResponse.message?.toLowerCase().includes('no product found') ||
              productResponse.message?.toLowerCase().includes('not found') ||
              // Check if data is an object but missing required productId field
              (typeof responseData === 'object' && !Array.isArray(responseData) && !('productId' in responseData));
            
            if (isProductDeleted) {
              console.log(`Product ${apiItem.productId} no longer exists, removing from cart`);
              deletedProductIds.push(apiItem.productId);
              
              // Remove from server cart
              try {
                await cartApi.removeItem({
                  cartItemId: apiItem.cartItemId
                });
              } catch (removeError) {
                console.error(`Failed to remove deleted product ${apiItem.productId} from cart:`, removeError);
              }
            } else {
              // Product exists, create cart item
              const cartItem = get()._mapApiItemToCartItem(apiItem);
              validCartItems.push(cartItem);
            }
          } catch (error) {
            // Product doesn't exist (404) or other error
            if (error instanceof ApiError && error.status === 404) {
              console.log(`Product ${apiItem.productId} no longer exists (404), removing from cart`);
              deletedProductIds.push(apiItem.productId);
              
              // Remove from server cart
              try {
                await cartApi.removeItem({
                  cartItemId: apiItem.cartItemId
                });
              } catch (removeError) {
                console.error(`Failed to remove deleted product ${apiItem.productId} from cart:`, removeError);
              }
            } else {
              // For other errors, still include the item but log the error
              console.warn(`Could not verify product ${apiItem.productId}:`, error);
              const cartItem = get()._mapApiItemToCartItem(apiItem);
              validCartItems.push(cartItem);
            }
          }
        }
        
        // Update state with only valid items
        set({
          serverItems: validCartItems,
          isLoading: false
        });
        
        // Log summary
        if (deletedProductIds.length > 0) {
          console.log(`Removed ${deletedProductIds.length} deleted product(s) from cart`);
        }
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
    // Prevent concurrent migrations
    const { isMigrating } = get();
    if (isMigrating) {
      console.log('⚠️ Migration already in progress, skipping...');
      return;
    }

    // Capture guest items at the start to prevent race conditions
    const { guestItems: initialGuestItems } = get();
    
    console.log('🔄 Starting cart migration. Guest items:', initialGuestItems.length);
    
    if (initialGuestItems.length === 0) {
      // No guest cart to migrate, just load server cart
      console.log('📦 No guest items, loading server cart...');
      try {
        set({ isLoading: true, error: null });
        await get().loadServerCart();
        set({ isLoading: false });
      } catch (error) {
        console.error('❌ Failed to load server cart:', error);
        set({ 
          isLoading: false, 
          error: apiErrorUtils.getErrorMessage(error)
        });
      }
      return;
    }

    try {
      set({ isLoading: true, isMigrating: true, error: null });
      
      // Step 1: Load existing server cart first (if possible)
      let serverItems: CartItem[] = [];
      try {
        console.log('📥 Loading existing server cart...');
        await get().loadServerCart();
        serverItems = get().serverItems;
        console.log(`📥 Loaded ${serverItems.length} items from server cart`);
      } catch (loadError) {
        console.warn('⚠️ Failed to load server cart, will add guest items as new items:', loadError);
        // Continue with migration - we'll add all guest items as new items
      }

      // Step 2: Merge guest items with server items
      // Use the captured guest items to prevent issues if state changes during migration
      console.log('🔄 Merging guest cart with server cart...');
      const itemsToAdd: Array<{ productId: string; quantity: number }> = [];
      const itemsToUpdate: Array<{ cartItemId: string; quantity: number }> = [];
      
      for (const guestItem of initialGuestItems) {
        const existingServerItem = serverItems.find(
          serverItem => serverItem.product.id === guestItem.product.id
        );
        
        if (existingServerItem) {
          // Product exists in both carts - combine quantities
          const combinedQuantity = existingServerItem.quantity + guestItem.quantity;
          console.log(
            `🔄 Merging: ${guestItem.product.name} ` +
            `(server: ${existingServerItem.quantity} + guest: ${guestItem.quantity} = ${combinedQuantity})`
          );
          
          if (existingServerItem.cartItemId) {
            itemsToUpdate.push({
              cartItemId: existingServerItem.cartItemId,
              quantity: combinedQuantity
            });
          } else {
            // Fallback: if no cartItemId, add as new item
            itemsToAdd.push({
              productId: guestItem.product.id,
              quantity: combinedQuantity
            });
          }
        } else {
          // New product - add it
          console.log(`➕ Adding new item: ${guestItem.product.name} (qty: ${guestItem.quantity})`);
          itemsToAdd.push({
            productId: guestItem.product.id,
            quantity: guestItem.quantity
          });
        }
      }
      
      // Step 3: Sync merged items to server
      console.log(`📤 Syncing ${itemsToUpdate.length} updates and ${itemsToAdd.length} new items to server...`);
      
      // Update existing items with combined quantities
      for (const update of itemsToUpdate) {
        try {
          await cartApi.updateItem({
            cartItemId: update.cartItemId,
            quantity: update.quantity
          });
        } catch (error) {
          console.error(`❌ Failed to update cart item ${update.cartItemId}:`, error);
          // Continue with other items
        }
      }
      
      // Add new items - reload cart after updates to get latest state
      // The server's addItem API might auto-merge quantities, so we need to check before each add
      await get().loadServerCart();
      
      for (const add of itemsToAdd) {
        try {
          // Reload cart to get latest state (in case previous adds changed it)
          await get().loadServerCart();
          const currentServerItems = get().serverItems;
          
          // Check if item already exists in server cart
          // (might have been added by previous migration attempt or auto-merged by server)
          const existingItem = currentServerItems.find(
            item => item.product.id === add.productId
          );
          
          if (existingItem && existingItem.cartItemId) {
            // Item already exists - this shouldn't happen for new items, but handle it
            // The server's addItem might have auto-merged, or migration ran twice
            console.log(
              `⚠️ Item ${add.productId} already exists in server cart ` +
              `(qty: ${existingItem.quantity}), skipping add to avoid duplication`
            );
            // Don't add or update - item already exists, migration might have run twice
            // The quantity should already be correct from the first migration
          } else {
            // Item doesn't exist - safe to add
            console.log(`➕ Adding new item: ${add.productId} (qty: ${add.quantity})`);
            await cartApi.addItem({
              productId: add.productId,
              quantity: add.quantity
            });
          }
        } catch (error) {
          console.error(`❌ Failed to add/update product ${add.productId}:`, error);
          // Continue with other items
        }
      }
      
      // Step 4: Reload merged cart from server
      console.log('📥 Loading final merged cart from server...');
      await get().loadServerCart();
      
      // Step 5: Clear guest cart only after successful migration
      // Double-check that we still have the same guest items (prevent clearing if migration was called multiple times)
      const currentGuestItems = get().guestItems;
      if (currentGuestItems.length === initialGuestItems.length) {
        set({ 
          guestItems: [],
          isLoading: false,
          isMigrating: false
        });
        console.log('✅ Cart migration completed successfully. Guest cart cleared.');
      } else {
        console.warn('⚠️ Guest cart changed during migration, not clearing to preserve new items');
        set({ 
          isLoading: false,
          isMigrating: false
        });
      }
    } catch (error) {
      console.error('❌ Failed to migrate guest cart:', error);
      // Don't clear guest items on error - they should be preserved for retry
      set({ 
        isLoading: false,
        isMigrating: false,
        error: apiErrorUtils.getErrorMessage(error)
      });
      // Re-throw to allow caller to handle
      throw error;
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
    }),
    {
      name: 'cart-storage',
      // Only persist guest items and UI state
      partialize: (state) => ({
        guestItems: state.guestItems,
        isOpen: state.isOpen,
      }),
    }
  )
);