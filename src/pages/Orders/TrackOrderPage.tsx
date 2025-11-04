import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle,
  MapPin,
  FileText,
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
import { mockApi } from "../../data/mockData";
import { cn } from "../../lib/utils";

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  current: boolean;
  icon: React.ReactNode;
}

interface OrderDetails {
  id: string;
  orderDate: string;
  estimatedDelivery: string;
  status: "confirmed" | "shipped" | "out-for-delivery" | "delivered";
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
      if (!id) return;

      // Mock order data based on the design
      const mockOrderDetails: OrderDetails = {
        id: id || "3354654654526",
        orderDate: "Feb 16, 2022",
        estimatedDelivery: "May 16, 2022",
        status: "out-for-delivery",
        trackingNumber: "TRK123456789",
        items: [
          {
            id: "1",
            name: 'MacBook Pro 14"',
            image:
              "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop",
            price: 2599.0,
            quantity: 1,
            color: "Space Gray",
            size: "32GB 1TB",
          },
        ],
        payment: {
          method: "Visa",
          last4: "4758",
        },
        delivery: {
          address: "No2 Kobape Road Apt. along Lagos,",
          city: "Abeokuta",
          postalCode: "234810565869",
        },
        summary: {
          subtotal: 5554,
          discount: 1109.4,
          discountPercentage: 20,
          delivery: 0.0,
          tax: 221.88,
          total: 0.0,
        },
      };

      try {
        setLoading(true);
        // Try to get real order data first
        try {
          const order = await mockApi.getOrder(id);
          // Convert Order to OrderDetails format
          const convertedOrder: OrderDetails = {
            id: order.id,
            orderDate: new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            estimatedDelivery: "May 16, 2022", // Could be calculated based on order date
            status:
              order.status === "shipped" ? "out-for-delivery" : "confirmed",
            trackingNumber: `TRK${order.id.slice(-9)}`,
            items: order.items.map((item) => ({
              id: item.id,
              name: item.product.name,
              image: item.product.images.main,
              price:
                typeof item.product.price === "number"
                  ? item.product.price
                  : item.product.price.current,
              quantity: item.quantity,
              color: "Space Gray", // Could come from variant selection
              size: "32GB 1TB", // Could come from variant selection
            })),
            payment: {
              method: "Visa",
              last4: "4758",
            },
            delivery: {
              address: order.shippingAddress.street,
              city: order.shippingAddress.city,
              postalCode: order.shippingAddress.zipCode,
            },
            summary: {
              subtotal: order.total,
              discount: order.total * 0.2, // 20% discount
              discountPercentage: 20,
              delivery: 0.0,
              tax: order.total * 0.08, // 8% tax
              total: order.total,
            },
          };
          setOrderDetails(convertedOrder);
        } catch {
          // Fallback to mock data if order not found
          setOrderDetails(mockOrderDetails);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load order details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [id]);

  const getTrackingSteps = (status: string): TrackingStep[] => {
    const baseSteps = [
      {
        id: "confirmed",
        title: "Order Confirmed",
        description: "Wed, 11th Jan",
        date: "Wed, 11th Jan",
        completed: true,
        current: false,
        icon: <CheckCircle className="w-5 h-5" />,
      },
      {
        id: "shipped",
        title: "Shipped",
        description: "Wed, 11th Jan",
        date: "Wed, 11th Jan",
        completed: status !== "confirmed",
        current: status === "shipped",
        icon: <Package className="w-5 h-5" />,
      },
      {
        id: "out-for-delivery",
        title: "Out For Delivery",
        description: "Wed, 11th Jan",
        date: "Wed, 11th Jan",
        completed: status === "delivered",
        current: status === "out-for-delivery",
        icon: <Truck className="w-5 h-5" />,
      },
      {
        id: "delivered",
        title: "Delivered",
        description: "Expected by, Mon 16th",
        date: "Expected by, Mon 16th",
        completed: status === "delivered",
        current: false,
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ];

    return baseSteps;
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

  const trackingSteps = getTrackingSteps(orderDetails.status);

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

          <div className="flex gap-3 mt-4 lg:mt-0">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoice
            </Button>
            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <Package className="w-4 h-4" />
              Track order
            </Button>
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
                        ((trackingSteps.filter((step) => step.completed)
                          .length -
                          1) *
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
                              ? "border-green-500 text-green-500"
                              : step.current
                              ? "border-blue-500 text-blue-500"
                              : "border-gray-300 text-gray-400"
                          )}
                        >
                          {step.completed ? (
                            <CheckCircle className="w-6 h-6 fill-current" />
                          ) : (
                            step.icon
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
                          {step.current && step.id === "out-for-delivery" && (
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
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{item.color}</span>
                        <span>{item.size}</span>
                      </div>
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
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <span className="text-gray-600">
                      **** **** **** {orderDetails.payment.last4}
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
                      15/02/25
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600"></span>
                    <Badge className="bg-green-100 text-green-800">
                      On Time
                    </Badge>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">Order Placed</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">Order Confirmed</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      </div>
                      <span className="text-sm">Awaiting Pickup</span>
                    </div>

                    <div className="ml-6 text-xs text-gray-500">
                      We Are Waiting for Rider to Pick Up Product From Pickup
                      Location
                    </div>

                    <div className="flex items-center gap-2 opacity-50">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white"></div>
                      <span className="text-sm text-gray-400">In Transit</span>
                    </div>

                    <div className="flex items-center gap-2 opacity-50">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white"></div>
                      <span className="text-sm text-gray-400">
                        Order Delivered
                      </span>
                    </div>
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
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium">
                      {formatPrice(orderDetails.summary.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium">
                      ({orderDetails.summary.discountPercentage}%) -{" "}
                      {formatPrice(orderDetails.summary.discount)}
                    </span>
                  </div>

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
