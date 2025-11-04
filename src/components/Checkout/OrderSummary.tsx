import React from 'react';
import { Card, CardContent } from '../UI';
import type { CartItem } from '../../types';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax?: number;
  total: number;
  showTitle?: boolean;
  compact?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  shipping,
  tax = 0,
  total,
  showTitle = true,
  compact = false
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  return (
    <Card>
      <CardContent className={compact ? "p-4" : "p-6"}>
        {showTitle && (
          <h3 className={`font-semibold text-gray-900 mb-4 ${compact ? 'text-base' : 'text-lg'}`}>
            Order Summary
          </h3>
        )}

        {/* Order Items */}
        {!compact && (
          <div className="space-y-4 mb-6">
            {items.map((item) => {
              const product = item.product;
              const currentPrice = typeof product.price === 'number' 
                ? product.price 
                : product.price.current;
              
              return (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={product.images.main}
                      alt={product.images.alt}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatPrice(currentPrice)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Totals */}
        <div className={`space-y-3 ${!compact && 'border-t border-gray-200 pt-4'}`}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping:</span>
            <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
              {shipping === 0 ? 'Free' : formatPrice(shipping)}
            </span>
          </div>
          
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{formatPrice(tax)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-3">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {compact && items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {items.length} {items.length === 1 ? 'item' : 'items'} in your order
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderSummary;