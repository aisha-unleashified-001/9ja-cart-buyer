import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  ShoppingBag, 
  ArrowLeft
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  Badge, 
  Modal,
  Alert
} from '../../components/UI';
import { CartItem, CartSummary } from '../../components/Cart';
import { useCart } from '../../hooks/useCart';
import { useProfile } from '../../hooks/api/useProfile';
import { useDeliveryValidation } from '../../hooks/useDeliveryValidation';
import { inferMixedDeliveryCase } from '../../api/order';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items, 
    removeFromCart, 
    clearAllItems, 
    totalItems,
    isLoading,
    isInitialLoading,
    error,
    isAuthenticated
  } = useCart();
  const { getDefaultAddress } = useProfile();

  const [showClearModal, setShowClearModal] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const defaultAddress = getDefaultAddress();
  const buyerAddressForDelivery = useMemo(() => {
    const city = defaultAddress?.city?.trim();
    const state = defaultAddress?.state?.trim();
    return [city, state].filter(Boolean).join(', ');
  }, [defaultAddress]);

  const {
    validation: deliveryValidation,
    isLoading: isDeliveryValidationLoading,
    error: deliveryValidationError,
  } = useDeliveryValidation({
    buyerAddress: buyerAddressForDelivery,
    cartLineItems: items,
    enabled: items.length > 0 && Boolean(buyerAddressForDelivery),
  });

  const affectedSet = useMemo(
    () => new Set(deliveryValidation?.affectedProductIds ?? []),
    [deliveryValidation?.affectedProductIds]
  );

  const highlightedProductIds = useMemo(
    () => items.filter((i) => affectedSet.has(i.product.id)).map((i) => i.product.id),
    [items, affectedSet]
  );

  const inferredMixed = useMemo(
    () =>
      inferMixedDeliveryCase(
        deliveryValidation?.affectedProductIds ?? [],
        items.map((i) => i.product.id)
      ),
    [deliveryValidation?.affectedProductIds, items]
  );

  const showMixedBanner =
    highlightedProductIds.length > 0 &&
    (Boolean(deliveryValidation?.isMixedCart) || inferredMixed);



  const handleRemoveItem = async (productId: string) => {
    setRemovingItemId(productId);
    setTimeout(async () => {
      try {
        await removeFromCart(productId);
      } catch (error) {
        console.error('Failed to remove item:', error);
      } finally {
        setRemovingItemId(null);
      }
    }, 300);
  };

  const handleClearCart = async () => {
    try {
      await clearAllItems();
      setShowClearModal(false);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  // Show loading state only for initial cart loading, not for operations
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
        <div className=" mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </div>

          {/* Loading State */}
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#182F38] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading your cart...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Only show empty cart message after initial loading is complete
  if (!isInitialLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
        <div className=" mx-auto px-4 py-8 w-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
        </div>

        {/* Empty Cart - Centered */}
        <div className="flex-1 flex items-center justify-center pb-8">
          <div className=" mx-auto px-4 w-full">
            <Card className="max-w-md mx-auto text-center">
              <CardContent className="p-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-600 mb-6">
                  Looks like you haven't added any items to your cart yet.
                </p>
                <Button asChild className="w-full">
                  <Link to="/products">
                    Continue Shopping
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
      <div className=" mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 touch-target"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="w-fit">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Badge>
                {isLoading && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Loading...
                  </Badge>
                )}
                {!isAuthenticated && items.length > 0 && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Guest Cart
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowClearModal(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 touch-target"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert 
            variant="destructive" 
            title="Error"
            className="mb-6"
          >
            {error}
          </Alert>
        )}

        {isDeliveryValidationLoading && (
          <Alert
            variant="default"
            title="Checking delivery eligibility"
            className="mb-6 border-blue-200 bg-blue-50"
          >
            We are validating delivery locations for items in your cart.
          </Alert>
        )}

        {deliveryValidationError && (
          <Alert
            variant="default"
            title="Delivery validation unavailable"
            className="mb-6 border-red-200 bg-red-50"
          >
            {deliveryValidationError}
          </Alert>
        )}

        {showMixedBanner && (
          <Alert
            variant="default"
            title="Mixed cart detected"
            className="mb-6 border-green-200 bg-green-50"
          >
            Some items in your cart are from vendors located outside Lagos.
            At the moment, automated delivery is only available for orders where
            both pickup and delivery locations are within Lagos. Delivery for
            items outside Lagos is currently handled manually, and our support
            team will contact you to confirm delivery arrangements and pricing.
            To continue with automated checkout, you can remove items from
            vendors outside Lagos.
          </Alert>
        )}

        {/* Guest Cart Notice */}
        {!isAuthenticated && items.length > 0 && (
          <Alert 
            variant="default" 
            title="Guest Cart"
            className="mb-6 border-orange-200 bg-orange-50"
          >
            Your cart will be lost when you refresh the page. <Link to="/auth/login" className="font-medium text-orange-700 hover:text-orange-800 underline">Sign in</Link> to save your cart.
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-0">
                  <CartItem
                    item={item}
                    onRemove={handleRemoveItem}
                    isRemoving={removingItemId === item.product.id}
                    isDeliveryFlagged={affectedSet.has(item.product.id)}
                  />
                </CardContent>
              </Card>
            ))}

            {/* Continue Shopping */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      Continue Shopping
                    </h3>
                    <p className="text-sm text-gray-600">
                      Discover more products you might like
                    </p>
                  </div>
                  <Button variant="outline" asChild className="border-[#2ac12a]">
                    <Link to="/products">
                      Browse Products
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <CartSummary />
        </div>
      </div>

      {/* Clear Cart Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Cart"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to remove all items from your cart? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowClearModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearCart}
            >
              Clear Cart
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CartPage;