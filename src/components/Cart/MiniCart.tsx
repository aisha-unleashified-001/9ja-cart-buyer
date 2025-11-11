import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';
import { Button, Image, Badge } from '../UI';
import { useCart } from '../../hooks/useCart';
import { cn } from '../../lib/utils';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const MiniCart: React.FC<MiniCartProps> = ({ isOpen, onClose, className }) => {
  const { items, removeFromCart, updateCartItemQuantity, getCartSummary } = useCart();
  const summary = getCartSummary();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Mini Cart Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              Shopping Cart ({summary.itemCount})
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-500 mb-4">
                  Add some products to get started
                </p>
                <Button asChild onClick={onClose}>
                  <Link to="/products">
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {items.map((item) => {
                  const product = item.product;
                  const currentPrice = typeof product.price === 'number' 
                    ? product.price 
                    : product.price.current;
                  const originalPrice = typeof product.price === 'object' 
                    ? product.price.original 
                    : undefined;
                  const discount = typeof product.price === 'object' 
                    ? product.price.discount 
                    : undefined;

                  return (
                    <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                      {/* Product Image */}
                      <Link 
                        to={`/products/${product.id}`}
                        onClick={onClose}
                        className="flex-shrink-0"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                          <Image
                            src={product.images.main}
                            alt={product.images.alt}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/products/${product.id}`}
                          onClick={onClose}
                          className="font-medium text-sm text-gray-900 hover:text-primary line-clamp-2"
                        >
                          {product.name}
                        </Link>
                        
                        {product.storeName && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.storeName}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-semibold text-sm">
                            ${currentPrice.toFixed(2)}
                          </span>
                          {originalPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              ${originalPrice.toFixed(2)}
                            </span>
                          )}
                          {discount && (
                            <Badge variant="destructive" className="text-xs">
                              -{discount.percentage}%
                            </Badge>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border rounded">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateCartItemQuantity(product.id, item.quantity - 1)}
                              className="h-6 w-6 rounded-none"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="px-2 text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateCartItemQuantity(product.id, item.quantity + 1)}
                              className="h-6 w-6 rounded-none"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(product.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">{summary.formattedSubtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span className="font-medium">{summary.formattedShipping}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{summary.formattedTotal}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button asChild className="w-full" onClick={onClose}>
                  <Link to="/checkout">
                    Checkout
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full"
                  onClick={onClose}
                >
                  <Link to="/cart">
                    View Cart
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MiniCart;