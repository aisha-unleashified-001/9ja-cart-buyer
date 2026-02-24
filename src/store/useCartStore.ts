import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '../types';
import { cartApi, type ApiCartItem, type ApiCartSummary } from '../api/cart';
import { productsApi } from '../api/products';
import { apiErrorUtils } from '../utils/api-errors';
import { ApiError } from '../api/client';
import { mapApiProductToProduct } from '../utils/product-mappers';

/** Flat rate fee in naira applied to every order (e.g. handling/delivery) */
export const FLAT_RATE_NGN = 750;

interface CartStore {
  // Guest cart data (persisted to localStorage)
  guestItems: CartItem[];
  
  // Authenticated cart data (from server)
  serverItems: CartItem[];
  
  // Server cart summary (from API response)
  serverSummary: ApiCartSummary | null;
  
  // UI state
  isOpen: boolean;
  isLoading: boolean; // For operations (add, remove, update)
  isInitialLoading: boolean; // For initial cart loading
  error: string | null;
  
  // Per-item loading states
  updatingItems: Set<string>; // Track which items are being updated
  
  // Migration state
  isMigrating: boolean;
  
  // Core methods
  addItem: (product: Product, quantity?: number, isAuthenticated?: boolean) => Promise<void>;
  removeItem: (productId: string, isAuthenticated?: boolean) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, isAuthenticated?: boolean) => Promise<void>;
  clearCart: (isAuthenticated?: boolean) => Promise<void>;
  
  // Authentication methods
  loadServerCart: (isInitial?: boolean, skipVerification?: boolean) => Promise<void>;
  migrateGuestCartOnLogin: () => Promise<void>;
  clearGuestCart: () => void;
  handleLogout: () => void;
  
  // Utility methods
  toggleCart: () => void;
  getItems: (isAuthenticated: boolean) => CartItem[];
  getAvailableItems: (isAuthenticated: boolean) => CartItem[];
  getTotalItems: (isAuthenticated: boolean) => number;
  getTotalPrice: (isAuthenticated: boolean) => number;
  getSubtotal: (isAuthenticated: boolean) => number;
  getShipping: (isAuthenticated: boolean) => number;
  getTax: (isAuthenticated: boolean) => number;
  getCommission: (isAuthenticated: boolean) => number;
  hasCommission: (isAuthenticated: boolean) => boolean;
  getFlatRate: () => number;
  getFinalTotal: (isAuthenticated: boolean) => number;
  isItemInCart: (productId: string, isAuthenticated: boolean) => boolean;
  getItemQuantity: (productId: string, isAuthenticated: boolean) => number;
  
  // Internal helpers
  _mapApiItemToCartItem: (apiItem: ApiCartItem, product?: Product) => CartItem;
  _getAvailableItems: (items: CartItem[]) => CartItem[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  // Initial state
  guestItems: [],
  serverItems: [],
  serverSummary: null,
  isOpen: false,
  isLoading: false,
  isInitialLoading: false,
  error: null,
  updatingItems: new Set<string>(),
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
      // Authenticated: Use optimistic updates
      const { serverItems } = get();
      const item = serverItems.find(item => item.product.id === productId);
      
      if (!item?.cartItemId) {
        return;
      }

      // Store previous quantity for potential rollback
      const previousQuantity = item.quantity;

      // Optimistically update UI immediately
      set((state) => ({
        serverItems: state.serverItems.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        ),
        updatingItems: new Set([...state.updatingItems, productId])
      }));

      try {
        // Update on server in background
        await cartApi.updateItem({
          cartItemId: item.cartItemId,
          quantity: quantity
        });
        
        // No need to reload entire cart - optimistic update is already applied
        // The server state is now in sync with our optimistic update
      } catch (error) {
        // On error, revert optimistic update
        set((state) => ({
          serverItems: state.serverItems.map(item =>
            item.product.id === productId
              ? { ...item, quantity: previousQuantity }
              : item
          )
        }));
        const errorMessage = apiErrorUtils.getErrorMessage(error);
        set({ error: errorMessage });
        throw new Error(errorMessage);
      } finally {
        // Remove from updating set
        set((state) => {
          const newUpdatingItems = new Set(state.updatingItems);
          newUpdatingItems.delete(productId);
          return { updatingItems: newUpdatingItems };
        });
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
        set({ serverItems: [], serverSummary: null });
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
  loadServerCart: async (isInitial = false, skipVerification = false) => {
    try {
      if (isInitial) {
        set({ isInitialLoading: true, error: null });
      } else {
        set({ isLoading: true, error: null });
      }
      
      const response = await cartApi.getCart();
      
      if (response.data) {
        const { items: apiItems, summary } = response.data;
        
        // Store the summary from API response
        set({ serverSummary: summary });
        
        // Fast path: skip product verification during migration for better performance
        if (skipVerification) {
          const cartItems = apiItems.map(apiItem => get()._mapApiItemToCartItem(apiItem));
          set({
            serverItems: cartItems,
            isLoading: false,
            isInitialLoading: false
          });
          return;
        }
        
        // Full verification path: verify each product exists and filter out deleted products
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
              // Product exists, map it and create cart item
              const mappedProduct = mapApiProductToProduct(responseData);
              const cartItem = get()._mapApiItemToCartItem(apiItem, mappedProduct);
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
        
        // Update state with only valid items and summary
        set({
          serverItems: validCartItems,
          serverSummary: summary,
          isLoading: false,
          isInitialLoading: false
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
        isInitialLoading: false, 
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
      
      // Step 1: Load existing server cart first (fast, skip verification for speed)
      let serverItems: CartItem[] = [];
      try {
        console.log('📥 Loading existing server cart (fast mode)...');
        await get().loadServerCart(false, true); // Skip verification for speed
        serverItems = get().serverItems;
        console.log(`📥 Loaded ${serverItems.length} items from server cart`);
      } catch (loadError) {
        console.warn('⚠️ Failed to load server cart, will add guest items as new items:', loadError);
        // Continue with migration - we'll add all guest items as new items
      }

      // Step 2: Merge guest items with server items and create optimistic merged cart
      console.log('🔄 Merging guest cart with server cart...');
      const itemsToAdd: Array<{ productId: string; quantity: number }> = [];
      const itemsToUpdate: Array<{ cartItemId: string; quantity: number }> = [];
      
      // Create merged cart items for optimistic update
      const mergedItems: CartItem[] = [...serverItems];
      
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
          
          // Update optimistic merged cart
          const mergedItemIndex = mergedItems.findIndex(
            item => item.product.id === guestItem.product.id
          );
          if (mergedItemIndex >= 0) {
            mergedItems[mergedItemIndex] = {
              ...mergedItems[mergedItemIndex],
              quantity: combinedQuantity
            };
          }
          
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
          
          // Add to optimistic merged cart
          mergedItems.push(guestItem);
        }
      }
      
      // Step 3: Optimistically update UI immediately with merged cart
      console.log('✨ Optimistically updating UI with merged cart...');
      set({ 
        serverItems: mergedItems,
        guestItems: [] // Clear guest cart immediately for better UX
      });
      
      // Step 4: Sync merged items to server in parallel for better performance
      console.log(`📤 Syncing ${itemsToUpdate.length} updates and ${itemsToAdd.length} new items to server...`);
      
      // Execute all API calls in parallel
      const updatePromises = itemsToUpdate.map(update =>
        cartApi.updateItem({
          cartItemId: update.cartItemId,
          quantity: update.quantity
        }).catch(error => {
          console.error(`❌ Failed to update cart item ${update.cartItemId}:`, error);
          return null; // Continue with other items
        })
      );
      
      const addPromises = itemsToAdd.map(add =>
        cartApi.addItem({
          productId: add.productId,
          quantity: add.quantity
        }).catch(error => {
          console.error(`❌ Failed to add product ${add.productId}:`, error);
          return null; // Continue with other items
        })
      );
      
      // Wait for all API calls to complete in parallel
      await Promise.all([...updatePromises, ...addPromises]);
      
      // Step 5: Reload final merged cart from server (fast, skip verification)
      console.log('📥 Loading final merged cart from server (fast mode)...');
      await get().loadServerCart(false, true); // Skip verification for speed
      
      // Step 6: Finalize migration
      const currentGuestItems = get().guestItems;
      if (currentGuestItems.length === 0 || currentGuestItems.length === initialGuestItems.length) {
        // Ensure guest cart is cleared
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
      // But if we already cleared them optimistically, try to restore
      const currentGuestItems = get().guestItems;
      if (currentGuestItems.length === 0 && initialGuestItems.length > 0) {
        // Restore guest items if migration failed
        set({ guestItems: initialGuestItems });
      }
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
      serverSummary: null,
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

  // Get only available items (excluding products with isSubaccountSet === false)
  getAvailableItems: (isAuthenticated: boolean) => {
    const items = get().getItems(isAuthenticated);
    return get()._getAvailableItems(items);
  },

  // Helper to filter out unavailable products
  _getAvailableItems: (items: CartItem[]) => {
    return items.filter(item => item.product.isSubaccountSet !== false);
  },

  // Calculation methods
  getTotalItems: (isAuthenticated: boolean) => {
    const items = get().getItems(isAuthenticated);
    const availableItems = get()._getAvailableItems(items);
    return availableItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  },

  getTotalPrice: (isAuthenticated: boolean) => {
    const items = get().getItems(isAuthenticated);
    const availableItems = get()._getAvailableItems(items);
    return availableItems.reduce((total: number, item: CartItem) => {
      const price = typeof item.product.price === 'number' ? item.product.price : item.product.price.current;
      return total + (price * item.quantity);
    }, 0);
  },

  getSubtotal: (isAuthenticated: boolean) => {
    // Always calculate from live items so the total updates immediately
    // when quantities are changed via optimistic updates.
    return get().getTotalPrice(isAuthenticated);
  },

  getShipping: (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      // Use shipping from server summary if available
      const { serverSummary } = get();
      if (serverSummary?.shipping !== undefined) {
        return serverSummary.shipping;
      }
    }
    // For guest users or when server summary is not available, calculate shipping
    const subtotal = get().getSubtotal(isAuthenticated);
    return subtotal > 50000 ? 0 : 2500; // Free shipping over ₦50,000 fallback
  },

  getTax: (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      // Use tax from server summary if available
      const { serverSummary } = get();
      if (serverSummary?.tax !== undefined) {
        return serverSummary.tax;
      }
    }
    // For guest users or when server summary is not available, calculate tax
    const subtotal = get().getSubtotal(isAuthenticated);
    return subtotal * 0.08; // 8% tax fallback
  },

  getCommission: (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      // Calculate commission from percentage if available
      const { serverSummary } = get();
      if (serverSummary?.platformCommissionPercentage !== undefined) {
        // Use the live calculated subtotal so commission updates with quantity changes
        const subtotal = get().getSubtotal(isAuthenticated);
        const commissionPercentage = serverSummary.platformCommissionPercentage;
        return subtotal * (commissionPercentage / 100);
      }
    }
    // For guest users or when server summary is not available, return 0
    return 0;
  },

  hasCommission: (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      const { serverSummary } = get();
      return serverSummary?.platformCommissionPercentage !== undefined;
    }
    return false;
  },

  getFlatRate: () => FLAT_RATE_NGN,

  getFinalTotal: (isAuthenticated: boolean) => {
    const subtotal = get().getSubtotal(isAuthenticated);
    const shipping = get().getShipping(isAuthenticated);
    const commission = get().getCommission(isAuthenticated);
    const flatRate = get().getFlatRate();
    return subtotal + shipping + commission + flatRate;
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