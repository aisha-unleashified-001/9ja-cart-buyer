import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Clock } from 'lucide-react';
import { Button, Card, CardContent, Badge, Modal, Loading, Alert } from '../../components/UI';
import { orderApi, transformApiOrderToOrder } from '../../api/order';
import type { Order } from '../../types';


const OrdersPage: React.FC = () => {
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItemsToReturn, setSelectedItemsToReturn] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const ordersData = await orderApi.getOrders();
        
        // Transform API response to Order type
        const transformedOrders = ordersData.map(transformApiOrderToOrder);
        setOrders(transformedOrders);
      } catch (err: any) {
        console.error('Failed to fetch orders:', err);
        setError(err.message || 'Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (location.state?.orderPlaced) {
      setShowSuccess(true);
      setOrderDetails(location.state);
      
      // Refetch orders to show the new order
      const fetchOrders = async () => {
        try {
          const ordersData = await orderApi.getOrders();
          const transformedOrders = ordersData.map(transformApiOrderToOrder);
          setOrders(transformedOrders);
        } catch (err) {
          console.error('Failed to refetch orders:', err);
        }
      };
      fetchOrders();
      
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

  const handleReturnClick = (order: Order) => {
    setSelectedOrder(order);
    // If single item, auto-select it
    if (order.items.length === 1) {
      setSelectedItemsToReturn(new Set([order.items[0].id]));
    } else {
      setSelectedItemsToReturn(new Set());
    }
    setReturnModalOpen(true);
  };

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItemsToReturn);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItemsToReturn(newSelected);
  };

  const handleReturnSubmit = () => {
    if (!selectedOrder || selectedItemsToReturn.size === 0) {
      return;
    }

    // TODO: Integrate with return endpoint when provided
    // const itemsToReturn = selectedOrder.items.filter(item => 
    //   selectedItemsToReturn.has(item.id)
    // );
    // await returnOrder(selectedOrder.id, itemsToReturn);

    // Close modal and reset state
    setReturnModalOpen(false);
    setSelectedOrder(null);
    setSelectedItemsToReturn(new Set());
    
    // Show success message (you can enhance this with a toast notification)
    alert(`Return request submitted for ${selectedItemsToReturn.size} item(s) from Order #${selectedOrder.id}`);
  };

  const handleReturnModalClose = () => {
    setReturnModalOpen(false);
    setSelectedOrder(null);
    setSelectedItemsToReturn(new Set());
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

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" title="Error loading orders" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && (
          <div className="space-y-6">
            {orders.length > 0 ? (
              orders.map((order) => (
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReturnClick(order)}
                      >
                        Return
                      </Button>
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
        )}
      </div>

      {/* Return Modal */}
      <Modal
        isOpen={returnModalOpen}
        onClose={handleReturnModalClose}
        title={`Return Items - Order #${selectedOrder?.id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select the product(s) you want to return from this order.
            </p>

            <div className="space-y-3">
              {selectedOrder.items.map((item) => {
                const isSelected = selectedItemsToReturn.has(item.id);
                const itemPrice = typeof item.product.price === 'number' 
                  ? item.product.price 
                  : item.product.price.current;

                return (
                  <label
                    key={item.id}
                    className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleItemToggle(item.id)}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.images.main}
                        alt={item.product.images.alt}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {formatPrice(itemPrice)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {selectedOrder.items.length > 1 && selectedItemsToReturn.size === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                Please select at least one item to return.
              </p>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={handleReturnModalClose}>
                Cancel
              </Button>
              <Button
                onClick={handleReturnSubmit}
                disabled={selectedItemsToReturn.size === 0}
              >
                Submit Return Request
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;