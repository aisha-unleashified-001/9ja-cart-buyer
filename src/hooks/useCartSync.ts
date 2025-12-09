import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

/**
 * Hook to handle cart migration on authentication state changes
 * - On login: migrates guest cart to server (one time only)
 * - On logout: clears server cart, starts fresh guest cart
 */
export const useCartSync = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { migrateGuestCartOnLogin, handleLogout, loadServerCart } = useCartStore();
  
  // Track previous auth state to detect changes
  const prevAuthState = useRef<{ isAuthenticated: boolean; userId: string | null }>({
    isAuthenticated: false,
    userId: null,
  });
  
  // Track if initial load has been done
  const hasInitialized = useRef(false);

  useEffect(() => {
    const currentUserId = user?.id || null;
    const prevState = prevAuthState.current;
    
    // Initial load: if user is authenticated and cart hasn't been loaded yet
    if (!hasInitialized.current && isAuthenticated && user) {
      hasInitialized.current = true;
      console.log('🔄 Initial load: User is authenticated, checking for guest cart to migrate...');
      
      // Check if there are guest items to migrate
      const { guestItems } = useCartStore.getState();
      if (guestItems.length > 0) {
        // User was authenticated on page load but has guest items - migrate them
        console.log(`🔄 Found ${guestItems.length} guest items, migrating to server...`);
        migrateGuestCartOnLogin().catch((error) => {
          console.error('❌ Failed to migrate guest cart on initial load:', error);
          // Don't throw - allow user to continue, cart will be preserved for retry
        });
      } else {
        // No guest items, just load server cart
        console.log('🔄 No guest items, loading server cart...');
        loadServerCart().catch((error) => {
          console.error('❌ Failed to load server cart on initial load:', error);
        });
      }
      
      prevAuthState.current = {
        isAuthenticated,
        userId: currentUserId,
      };
      return;
    }
    
    // Only act on actual auth state changes
    if (prevState.isAuthenticated !== isAuthenticated || prevState.userId !== currentUserId) {
      console.log('🔄 Auth state changed:', { 
        wasAuth: prevState.isAuthenticated, 
        nowAuth: isAuthenticated,
        prevUser: prevState.userId,
        currentUser: currentUserId
      });

      if (isAuthenticated && user && !prevState.isAuthenticated) {
        // User just logged in or signed up - migrate guest cart to server
        console.log('🔄 User authenticated (login/signup), migrating guest cart to server...');
        migrateGuestCartOnLogin().catch((error) => {
          console.error('❌ Failed to migrate guest cart on authentication:', error);
          // Don't throw - allow user to continue, cart will be preserved for retry
        });
      } else if (!isAuthenticated && prevState.isAuthenticated) {
        // User just logged out - clear server data, start fresh
        console.log('🔄 User logged out, clearing server cart data...');
        handleLogout();
        // Reset initialization flag so migration can run on next login
        hasInitialized.current = false;
      } else if (isAuthenticated && prevState.isAuthenticated && prevState.userId !== currentUserId) {
        // Different user logged in - load their cart
        console.log('🔄 Different user logged in, loading their cart...');
        loadServerCart().catch(console.error);
      }

      // Update previous state
      prevAuthState.current = {
        isAuthenticated,
        userId: currentUserId,
      };
    }
  }, [isAuthenticated, user?.id, user, migrateGuestCartOnLogin, handleLogout, loadServerCart]);

  // Return current auth status
  return {
    isAuthenticated,
  };
};