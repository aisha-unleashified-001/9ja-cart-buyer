import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Shield, RotateCcw } from 'lucide-react';
import { Button, Card, CardContent, Alert } from '../UI';
import { useCart } from '../../hooks/useCart';

interface CartSummaryProps {
  className?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ className }) => {
  const navigate = useNavigate();
  const { 
    totalItems,
    subtotal,
    shipping,
    tax,
    finalTotal,
    isAuthenticated
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  const handleApplyPromo = () => {
    // Mock promo code logic
    if (promoCode.toLowerCase() === 'save10') {
      setPromoApplied(true);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  formatPrice(shipping)
                )}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatPrice(tax)}</span>
            </div>

            {promoApplied && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Promo (SAVE10)</span>
                <span className="font-medium text-green-600">-{formatPrice(subtotal * 0.1)}</span>
              </div>
            )}
            
            <hr className="border-gray-200" />
            
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-lg text-gray-900">
                {formatPrice(promoApplied ? finalTotal - (subtotal * 0.1) : finalTotal)}
              </span>
            </div>
          </div>

          {/* Free Shipping Alert */}
          {subtotal < 50000 && (
            <Alert className="mt-4">
              <Truck className="w-4 h-4" />
              <div>
                <p className="text-sm">
                  Add {formatPrice(50000 - subtotal)} more for free shipping!
                </p>
              </div>
            </Alert>
          )}

          {/* Checkout Button */}
          <Button 
            onClick={handleCheckout}
            className="w-full mt-6"
            size="lg"
          >
            {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
          </Button>

          {/* Security Info */}
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Secure checkout</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Shipping & Returns</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Free Shipping</p>
                <p className="text-gray-600">On orders over ₦50,000</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <RotateCcw className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Easy Returns</p>
                <p className="text-gray-600">30-day return policy</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Secure Payment</p>
                <p className="text-gray-600">Your payment info is safe</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo Code */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Promo Code</h3>
          {!promoApplied ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleApplyPromo}
                disabled={!promoCode.trim()}
              >
                Apply
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <span className="text-sm font-medium text-green-800">
                Promo code "SAVE10" applied!
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPromoApplied(false);
                  setPromoCode('');
                }}
                className="text-green-600 hover:text-green-700"
              >
                Remove
              </Button>
            </div>
          )}
          
          {/* Promo Code Suggestions */}
          {!promoApplied && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Try these codes:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPromoCode('SAVE10')}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  SAVE10
                </button>
                <button
                  onClick={() => setPromoCode('FREESHIP')}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  FREESHIP
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CartSummary;