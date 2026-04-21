import React from 'react';
import { Card, CardContent } from '../UI';
import type { CartItem } from '../../types';
import { formatPrice } from '../../lib/productUtils';
import { cn } from '../../lib/utils';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  showShipping?: boolean;
  flatRate?: number;
  tax?: number;
  discount?: number;
  total: number;
  showTitle?: boolean;
  compact?: boolean;
  appliedCoupon?: string | null;
  /** Highlight lines (e.g. non-Lagos items in mixed-cart checkout). */
  highlightProductIds?: string[];
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  shipping,
  showShipping = true,
  flatRate = 0,
  tax = 0,
  discount = 0,
  total,
  showTitle = true,
  compact = false,
  appliedCoupon = null,
  highlightProductIds,
}) => {
  const highlightSet =
    highlightProductIds && highlightProductIds.length > 0
      ? new Set(highlightProductIds)
      : null;
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
              const isHighlighted =
                highlightSet?.has(product.id) ?? false;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center space-x-4 rounded-lg p-2 -mx-2 transition-colors",
                    isHighlighted &&
                      "bg-green-50 ring-1 ring-green-200/80"
                  )}
                >
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
                    {product.storeName && (
                      <p className="text-xs text-gray-500 truncate">{product.storeName}</p>
                    )}
                    {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                      <p className="text-xs text-gray-500 truncate">
                        {Object.entries(item.selectedVariants)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" • ")}
                      </p>
                    )}
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
          
          {showShipping && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping:</span>
              <span className={`font-medium ${shipping === 0 ? 'text-yellow-600' : ''}`}>
                {shipping === 0 ? 'Incoming' : formatPrice(shipping)}
              </span>
            </div>
          )}

          {flatRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Flat Rate:</span>
              <span className="font-medium">{formatPrice(flatRate)}</span>
            </div>
          )}

          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{formatPrice(tax)}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Discount {appliedCoupon && `(${appliedCoupon})`}:
              </span>
              <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
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