import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Clock } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '../../components/UI';
import { mockOrders } from '../../data/mockData';


const OrdersPage: React.FC = () => {
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (location.state?.orderPlaced) {
      setShowSuccess(true);
      setOrderDetails(location.state);
      
      // Clear the state after showing success
      const timer = setTimeout(() => {
        setShowSuccess(false);
        window.history.replaceState({}, document.title);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {/* Success Message */}
        {showSuccess && orderDetails && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-green-700">
                    Your order total of {formatPrice(orderDetails.orderTotal)} has been confirmed.
                    {orderDetails.paymentMethod === 'cash-on-delivery' && 
                      ' You will pay on delivery.'
                    }
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    You will receive an email confirmation shortly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          {mockOrders.length > 0 ? (
            mockOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                      {getStatusIcon(order.status)}
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.product.images.main}
                            alt={item.product.images.alt}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(
                            typeof item.product.price === 'number' 
                              ? item.product.price 
                              : item.product.price.current
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200">
                    <div className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                      Total: {formatPrice(order.total)}
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/orders/${order.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/track-order/${order.id}`}>
                          Track Order
                        </Link>
                      </Button>
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          Reorder
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No orders yet
                </h3>
                <p className="text-gray-500 mb-6">
                  When you place your first order, it will appear here.
                </p>
                <Button asChild>
                  <Link to="/products">
                    Start Shopping
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;