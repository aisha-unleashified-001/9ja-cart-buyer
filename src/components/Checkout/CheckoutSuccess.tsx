import React from 'react';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button, Card, CardContent } from '../UI';
import { Link } from 'react-router-dom';

interface CheckoutSuccessProps {
  orderNumber: string;
  orderTotal: number;
  paymentMethod: string;
  estimatedDelivery?: string;
  onClose?: () => void;
}

const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({
  orderNumber,
  orderTotal,
  paymentMethod,
  estimatedDelivery = '3-5 business days',
  onClose
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'cash-on-delivery':
        return 'Cash on Delivery';
      case 'bank-card':
        return 'Bank/Card';
      case 'buy-now-pay-later':
        return 'Buy Now, Pay Later';
      case 'emergency-credit':
        return 'Emergency Credit';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Order Number:</span>
                <span className="text-sm font-medium">#{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="text-sm font-medium">{formatPrice(orderTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <span className="text-sm font-medium">{getPaymentMethodDisplay(paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estimated Delivery:</span>
                <span className="text-sm font-medium">{estimatedDelivery}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Package className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  What's Next?
                </h4>
                <p className="text-xs text-blue-700">
                  You'll receive an email confirmation shortly. We'll notify you when your order ships.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/orders" onClick={onClose}>
                <Package className="w-4 h-4 mr-2" />
                View Order Details
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/products" onClick={onClose}>
                Continue Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;