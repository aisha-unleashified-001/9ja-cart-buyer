import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Truck,
  CheckCircle,
  MapPin,
  HelpCircle,
  RotateCcw,
  CreditCard,
  Calendar,
} from "lucide-react";
import {
  Breadcrumb,
  Button,
  Badge,
  Card,
  CardContent,
  Loading,
  Alert,
  Image,
} from "../../components/UI";
import { orderApi, type OrderDetailResponse } from "../../api/order";
import { cn } from "../../lib/utils";

type OrderStatus =
  | "order-placed"
  | "order-confirmed"
  | "awaiting-pickup"
  | "in-transit"
  | "order-delivered";

interface TrackingStep {
  id: OrderStatus;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  current: boolean;
}

interface OrderDetails {
  id: string;
  orderDate: string;
  estimatedDelivery: string;
  status: OrderStatus;
  apiStatus?: string; // Store original API status for special handling
  trackingNumber?: string;
  items: Array<{
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
  }>;
  payment: {
    method: string;
    last4?: string;
  };
  delivery: {
    address: string;
    city: string;
    postalCode: string;
  };
  summary: {
    subtotal: number;
    discount: number;
    discountPercentage?: number;
    delivery: number;
    tax: number;
    total: number;
  };
}

const TrackOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!id) {
        setError("Order ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get real order data from API
        const order: OrderDetailResponse = await orderApi.getOrderDetail(id);
        
        // Get order ID
        const orderId = order.orderId || order.orderNumber || order.orderNo || id;
        
        // Format dates
        const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        
        const estimatedDelivery = order.estimatedDelivery
          ? new Date(order.estimatedDelivery).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "TBD";
        
        // Map order status to tracking status
        const statusMap: Record<string, OrderStatus> = {
          completed: "order-delivered", // Will be handled specially in getTrackingSteps
          delivered: "order-delivered",
          shipped: "awaiting-pickup",
          processing: "order-confirmed",
          confirmed: "in-transit", // Will be handled specially in getTrackingSteps
          pending: "order-confirmed", // Default: first 2 stages active
        };
        
        const apiStatus = order.status.toUpperCase();
        const trackingStatus = statusMap[order.status.toLowerCase()] || "order-confirmed";
        
        // Convert OrderDetailResponse to OrderDetails format
        const convertedOrder: OrderDetails = {
          id: orderId,
          orderDate: orderDate,
          estimatedDelivery: estimatedDelivery,
          status: trackingStatus,
          apiStatus: apiStatus, // Store original API status
          trackingNumber: `TRK${orderId.slice(-9)}`,
          items: (order.items || []).map((item) => ({
            id: item.id || item.productId,
            name: item.productName || "Product",
            image: item.productImage || "",
            // Coerce safely for cases where backend sends numeric strings (while keeping current behavior for numbers)
            price: Number((item as any).price ?? 0),
            quantity: Math.max(1, Number.parseInt(String((item as any).quantity ?? 1), 10) || 1),
            // Remove hardcoded color and size - these can be added later if available in the API
          })),
          payment: {
            method: order.paymentMethod || "N/A",
            last4: undefined, // Can be extracted from payment info if available
          },
          delivery: {
            address: order.shippingAddress?.streetAddress || order.shippingAddress?.street || "",
            city: order.shippingAddress?.city || "",
            postalCode: order.shippingAddress?.zipCode || "",
          },
          summary: {
            subtotal: order.subtotal ?? (order.items || []).reduce((sum, item) => sum + (item.subtotal || (item.price || 0) * (item.quantity || 0)), 0),
            discount: order.discount || 0,
            discountPercentage: order.discount && order.subtotal ? Math.round((order.discount / order.subtotal) * 100) : undefined,
            delivery: order.shipping || 0,
            tax: order.tax || 0,
            total: order.total || 0,
          },
        };
        
        setOrderDetails(convertedOrder);
      } catch (err: any) {
        console.error("Failed to load order details:", err);
        setError(
          err?.message || err?.status === 401
            ? "Please log in to view order details"
            : "Failed to load order details. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [id]);

  const getTrackingSteps = (status: OrderStatus, apiStatus?: string): TrackingStep[] => {
    const orderedStatuses: OrderStatus[] = [
      "order-placed",
      "order-confirmed",
      "awaiting-pickup",
      "in-transit",
      "order-delivered",
    ];

    const labels: Record<OrderStatus, string> = {
      "order-placed": "Order Placed",
      "order-confirmed": "Order Confirmed",
      "awaiting-pickup": "Awaiting Pickup",
      "in-transit": "In Transit",
      "order-delivered": "Order Delivered",
    };

    const descriptions: Record<OrderStatus, string> = {
      "order-placed": orderDetails?.orderDate || "Order created",
      "order-confirmed": "We are confirming your order",
      "awaiting-pickup":
        "We are waiting for rider to pick up product from pickup location",
      "in-transit": "Your package is on the move",
      "order-delivered": "Package delivered to customer",
    };

    // Handle special status cases
    if (apiStatus === "COMPLETED") {
      // All stages completed
      return orderedStatuses.map((step) => ({
        id: step,
        title: labels[step],
        description: descriptions[step],
        date: descriptions[step],
        completed: true,
        current: false,
      }));
    }

    if (apiStatus === "CONFIRMED") {
      // Order Placed and Order Confirmed completed
      // Awaiting Pickup and In Transit completed (current at in-transit)
      return orderedStatuses.map((step, index) => {
        const inTransitIndex = orderedStatuses.indexOf("in-transit");
        return {
          id: step,
          title: labels[step],
          description: descriptions[step],
          date: descriptions[step],
          completed: index <= inTransitIndex,
          current: index === inTransitIndex,
        };
      });
    }

    // Default: Order Placed and Order Confirmed active (current at order-confirmed)
    const currentIndex = Math.max(
      orderedStatuses.indexOf(status),
      orderedStatuses.indexOf("order-confirmed") // Default to order-confirmed if status not found
    );

    return orderedStatuses.map((step, index) => ({
      id: step,
      title: labels[step],
      description: descriptions[step],
      date: descriptions[step],
      completed: index < currentIndex,
      current: index === currentIndex,
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" title="Error">
            {error || "Order not found"}
          </Alert>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Orders", href: "/orders" },
    { label: `ID ${orderDetails.id}`, isCurrentPage: true },
  ];

  const trackingSteps = getTrackingSteps(orderDetails.status, orderDetails.apiStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order ID: {orderDetails.id}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Order date: <strong>{orderDetails.orderDate}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>
                  Estimated delivery:{" "}
                  <strong>{orderDetails.estimatedDelivery}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Tracking */}
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                  <div
                    className="absolute left-6 top-12 w-0.5 bg-green-500 transition-all duration-500"
                    style={{
                      height: `${
                        (Math.max(
                          0,
                          trackingSteps.findIndex((step) => step.current)
                        ) *
                          100) /
                          (trackingSteps.length - 1)
                      }%`,
                    }}
                  ></div>

                  {/* Steps */}
                  <div className="space-y-8">
                    {trackingSteps.map((step) => (
                      <div key={step.id} className="relative flex items-start">
                        {/* Icon */}
                        <div
                          className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-full border-2 bg-white z-10",
                            step.completed
                              ? "border-green-500 bg-green-50 text-green-500"
                              : step.current
                              ? "border-yellow-500 bg-yellow-50 text-yellow-600"
                              : "border-gray-300 text-gray-400"
                          )}
                        >
                          {step.completed ? (
                            <CheckCircle className="w-6 h-6 fill-current" />
                          ) : (
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full",
                                step.current ? "bg-yellow-500" : "bg-gray-300"
                              )}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="ml-6 flex-1">
                          <h3
                            className={cn(
                              "text-lg font-semibold",
                              step.completed || step.current
                                ? "text-gray-900"
                                : "text-gray-500"
                            )}
                          >
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </p>

                          {/* Additional info for current step */}
                          {step.current && step.id === "awaiting-pickup" && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">
                                We Are Waiting for Rider to Pick Up Product From
                                Pickup Location
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardContent className="p-6">
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {item.name}
                      </h3>
                      {(item.color || item.size) && (
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          {item.color && <span>{item.color}</span>}
                          {item.size && <span>{item.size}</span>}
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(item.price)}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {orderDetails.payment.method?.substring(0, 4).toUpperCase() || "CARD"}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      {orderDetails.payment.last4
                        ? `**** **** **** ${orderDetails.payment.last4}`
                        : orderDetails.payment.method || "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery
                  </h3>
                  <div className="text-gray-600">
                    <p className="font-medium">Address</p>
                    <p className="text-sm mt-1">
                      {orderDetails.delivery.address}
                    </p>
                    <p className="text-sm">
                      {orderDetails.delivery.city}{" "}
                      {orderDetails.delivery.postalCode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Need Help</h3>
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left p-3 h-auto"
                    asChild
                  >
                    <Link
                      to="/support/order-issues"
                      className="flex items-center gap-3"
                    >
                      <HelpCircle className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Order Issues</p>
                        <p className="text-sm text-gray-500">
                          Report problems with your order
                        </p>
                      </div>
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left p-3 h-auto"
                    asChild
                  >
                    <Link
                      to="/support/returns"
                      className="flex items-center gap-3"
                    >
                      <RotateCcw className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Returns</p>
                        <p className="text-sm text-gray-500">
                          Start a return or exchange
                        </p>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Order Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Estimated Delivery Date
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {orderDetails.estimatedDelivery !== "TBD"
                        ? (() => {
                            try {
                              const date = new Date(orderDetails.estimatedDelivery);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                });
                              }
                            } catch {
                              // If parsing fails, show the formatted string as-is
                            }
                            return orderDetails.estimatedDelivery;
                          })()
                        : "TBD"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600"></span>
                    <Badge className="bg-green-100 text-green-800">
                      On Time
                    </Badge>
                  </div>

                  <div className="space-y-2 mt-4">
                    {trackingSteps.map((step) => (
                      <div key={step.id}>
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            !step.completed && !step.current
                              ? "opacity-70"
                              : ""
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center border-2",
                              step.completed
                                ? "bg-green-500 border-green-500"
                                : step.current
                                ? "border-yellow-500"
                                : "border-gray-300"
                            )}
                          >
                            {step.completed ? (
                              <CheckCircle className="w-3 h-3 text-white" />
                            ) : step.current ? (
                              <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            ) : null}
                          </div>
                          <span
                            className={cn(
                              "text-sm",
                              step.completed || step.current
                                ? "text-gray-900"
                                : "text-gray-500"
                            )}
                          >
                            {step.title}
                          </span>
                        </div>
                        {step.current && step.id === "awaiting-pickup" && (
                          <div className="ml-6 text-xs text-gray-500">
                            We Are Waiting for Rider to Pick Up Product From
                            Pickup Location
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {formatPrice(orderDetails.summary.subtotal)}
                    </span>
                  </div>

                  {orderDetails.summary.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">
                        {orderDetails.summary.discountPercentage
                          ? `(${orderDetails.summary.discountPercentage}%) - `
                          : ""}
                        {formatPrice(orderDetails.summary.discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium">
                      {formatPrice(orderDetails.summary.delivery)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">
                      +{formatPrice(orderDetails.summary.tax)}
                    </span>
                  </div>

                  <hr className="my-3" />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(orderDetails.summary.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
