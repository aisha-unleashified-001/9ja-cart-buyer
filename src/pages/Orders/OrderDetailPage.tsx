import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Package,
  Truck,
  Clock,
  MapPin,
  CreditCard,
  Calendar,
  ArrowLeft,
  FileText,
  Star,
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Loading, Alert, Image } from '../../components/UI';
import { RatingModal } from '../../components/Rating';
import { orderApi, type OrderDetailResponse } from '../../api/order';
import { useProductRatingsStore } from '../../store/useProductRatingsStore';
import { cn } from '../../lib/utils';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!id) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const order = await orderApi.getOrderDetail(id);
        setOrderDetails(order);
        // Fetch order ratings and merge into product ratings store for product cards
        const orderIdForRatings = order.orderId || order.orderNumber || order.orderNo || id;
        if (orderIdForRatings) {
          orderApi.getOrderRatings(orderIdForRatings).then((res) => {
            const list = res.data || [];
            useProductRatingsStore.getState().setRatingsFromOrder(list);
          }).catch(() => { /* ignore; ratings optional */ });
        }
      } catch (err: any) {
        console.error('Failed to load order details:', err);
        setError(
          err?.message || err?.status === 401
            ? 'Please log in to view order details'
            : 'Failed to load order details. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [id]);

  // Check if we should auto-open rating modal
  useEffect(() => {
    if (location.state?.openRating && !loading && orderDetails) {
      setIsRatingModalOpen(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loading, orderDetails]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'processing':
      case 'confirmed':
        return <Package className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Alert variant="destructive" title="Error">{error}</Alert>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive" title="Error">Order not found</Alert>
        </div>
      </div>
    );
  }

  const orderId = orderDetails.orderId || orderDetails.orderNumber || orderDetails.orderNo || id || 'N/A';
  const items = orderDetails.items || [];
  const subtotal = orderDetails.subtotal ?? items.reduce((sum, item) => sum + (item.subtotal || (item.price || 0) * (item.quantity || 0)), 0);
  const tax = orderDetails.tax ?? 0;
  const shipping = orderDetails.shipping ?? 0;
  const discount = orderDetails.discount ?? 0;
  const total = orderDetails.total || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Details
              </h1>
              <p className="text-gray-600">
                Order #{orderId}
              </p>
            </div>
            <Badge className={cn('text-sm px-4 py-2', getStatusColor(orderDetails.status))}>
              <div className="flex items-center gap-2">
                {getStatusIcon(orderDetails.status)}
                <span className="capitalize">{orderDetails.status}</span>
              </div>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Order Items
                </h2>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                    >
                      <div className="flex-shrink-0">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {item.productName}
                        </h3>
                        {item.vendor && (
                          <p className="text-sm text-gray-500 mb-2">
                            Vendor: {item.vendor}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatPrice(item.subtotal || item.price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-gray-500">
                                {formatPrice(item.price)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {orderDetails.shippingAddress && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Shipping Address
                    </h2>
                  </div>
                  <div className="text-gray-600 space-y-1">
                    <p className="font-medium">
                      {orderDetails.shippingAddress.firstName || ''}{' '}
                      {orderDetails.shippingAddress.lastName || ''}
                    </p>
                    <p>
                      {orderDetails.shippingAddress.streetAddress ||
                        orderDetails.shippingAddress.street ||
                        ''}
                    </p>
                    <p>
                      {orderDetails.shippingAddress.city}
                      {orderDetails.shippingAddress.state && `, ${orderDetails.shippingAddress.state}`}
                    </p>
                    {orderDetails.shippingAddress.zipCode && (
                      <p>{orderDetails.shippingAddress.zipCode}</p>
                    )}
                    {orderDetails.shippingAddress.country && (
                      <p>{orderDetails.shippingAddress.country}</p>
                    )}
                    {orderDetails.shippingAddress.phoneNumber && (
                      <p className="mt-2">Phone: {orderDetails.shippingAddress.phoneNumber}</p>
                    )}
                    {orderDetails.shippingAddress.emailAddress && (
                      <p>Email: {orderDetails.shippingAddress.emailAddress}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Address */}
            {orderDetails.billingAddress && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Billing Address
                    </h2>
                  </div>
                  <div className="text-gray-600 space-y-1">
                    <p className="font-medium">
                      {orderDetails.billingAddress.firstName || ''}{' '}
                      {orderDetails.billingAddress.lastName || ''}
                    </p>
                    <p>
                      {orderDetails.billingAddress.streetAddress ||
                        orderDetails.billingAddress.street ||
                        ''}
                    </p>
                    <p>
                      {orderDetails.billingAddress.city}
                      {orderDetails.billingAddress.state && `, ${orderDetails.billingAddress.state}`}
                    </p>
                    {orderDetails.billingAddress.zipCode && (
                      <p>{orderDetails.billingAddress.zipCode}</p>
                    )}
                    {orderDetails.billingAddress.country && (
                      <p>{orderDetails.billingAddress.country}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {formatDate(orderDetails.createdAt)}
                    </span>
                  </div>
                  
                  {orderDetails.estimatedDelivery && (
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm">
                        Est. Delivery: {formatDate(orderDetails.estimatedDelivery)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-green-600">-{formatPrice(discount)}</span>
                      </div>
                    )}
                    {shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-900">{formatPrice(shipping)}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">{formatPrice(tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3 mt-3">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Payment Information
                  </h2>
                </div>
                <div className="space-y-2 text-sm">
                  {orderDetails.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method</span>
                      <span className="text-gray-900 capitalize">
                        {orderDetails.paymentMethod}
                      </span>
                    </div>
                  )}
                  {orderDetails.paymentStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge
                        className={cn(
                          'text-xs',
                          orderDetails.paymentStatus.toLowerCase() === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        )}
                      >
                        {orderDetails.paymentStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {orderDetails.status.toLowerCase() === 'shipped' && (
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/track-order/${id}`}>
                    <Truck className="w-4 h-4 mr-2" />
                    Track Order
                  </Link>
                </Button>
              )}
              {orderDetails.status.toLowerCase() === 'delivered' && (
                <>
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => setIsRatingModalOpen(true)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Rate Order
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Package className="w-4 h-4 mr-2" />
                    Return Items
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {orderDetails && orderId && orderId !== 'N/A' && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          orderId={orderId}
          orderItems={orderDetails.items || []}
          onRatingSubmitted={() => {
            setIsRatingModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default OrderDetailPage;
