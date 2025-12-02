import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CreditCard,
  Truck,
  Shield,
  AlertCircle,
  User,
  UserPlus,
  Plus,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  Breadcrumb,
  Alert,
} from "../../components/UI";
import {
  CheckoutSuccess,
  OrderSummary,
  AddressSummary,
  AddressSelector,
} from "../../components/Checkout";
import { useCart } from "../../hooks/useCart";
import { useAuthStore } from "../../store/useAuthStore";
import { useProfile } from "../../hooks/api/useProfile";
import {
  validateBillingDetails,
  formatPhoneNumber,
  type BillingDetailsForm,
  type ValidationError,
} from "../../lib/checkoutValidation";
import {
  orderApi,
  transformBillingDetails,
  transformCartItemsToOrderItems,
  mapPaymentMethodToApi,
} from "../../api/order";
import { apiErrorUtils } from "../../utils/api-errors";
import { cn } from "../../lib/utils";
import type { UserAddress } from "../../types";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const { items, totalPrice, clearAllItems } = useCart();
  const { isAuthenticated, user } = useAuthStore();
  const { profile, fetchProfile, getDefaultAddress, getAddresses, addAddress } =
    useProfile();

  const [isProcessing, setIsProcessing] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("cash-on-delivery");
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [checkoutAsGuest, setCheckoutAsGuest] = useState(false);

  // Address management state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [billingDetails, setBillingDetails] = useState<BillingDetailsForm>({
    firstName: "",
    lastName: "",
    companyName: "",
    streetAddress: "",
    apartment: "",
    townCity: "",
    phoneNumber: "",
    emailAddress: "",
  });

  // Load profile and set up addresses
  useEffect(() => {
    if (isAuthenticated && !profile) {
      fetchProfile();
    }
  }, [isAuthenticated, profile, fetchProfile]);

  // Set up default address and pre-fill form
  useEffect(() => {
    if (isAuthenticated && profile) {
      const defaultAddress = getDefaultAddress();

      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
        // Auto-fill form with default address
        setBillingDetails((prev) => ({
          ...prev,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          emailAddress: user?.email || "",
          phoneNumber: user?.phone || "",
          streetAddress: defaultAddress.streetAddress,
          townCity: defaultAddress.city,
          apartment: "",
          companyName: "",
        }));
        setShowAddressForm(false); // Hide form since we have default address
      } else {
        // No default address, show form
        setShowAddressForm(true);
        setBillingDetails((prev) => ({
          ...prev,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          emailAddress: user?.email || "",
          phoneNumber: user?.phone || "",
        }));
      }
    } else if (!isAuthenticated && checkoutAsGuest) {
      // Guest checkout - always show form
      setShowAddressForm(true);
    }
  }, [isAuthenticated, profile, user, checkoutAsGuest, getDefaultAddress]);

  const paymentMethods: PaymentMethod[] = [
    {
      id: "bank-card",
      name: "Bank/Card",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: "cash-on-delivery",
      name: "Pay on delivery",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      id: "buy-now-pay-later",
      name: "Buy Now, Pay Later",
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: "emergency-credit",
      name: "Emergency Credit",
      icon: <Shield className="w-5 h-5" />,
    },
  ];

  const subtotal = totalPrice;
  const shipping = 0; // Free shipping
  const discount = couponDiscount;
  const total = subtotal + shipping - discount;

  // Address management functions
  const handleEditAddress = () => {
    setShowAddressForm(true);
    setShowAddressSelector(false);
  };

  const handleChangeAddress = () => {
    setShowAddressSelector(true);
    setShowAddressForm(false);
  };

  const handleSelectAddress = (address: UserAddress) => {
    setSelectedAddress(address);
    // Update billing details with selected address
    setBillingDetails((prev) => ({
      ...prev,
      streetAddress: address.streetAddress,
      townCity: address.city,
      apartment: "",
      companyName: "",
    }));
    setShowAddressSelector(false);
    setShowAddressForm(false);
  };

  const handleAddNewAddress = () => {
    setIsAddingNewAddress(true);
    setShowAddressSelector(false);
    setShowAddressForm(true);
    // Clear form for new address
    setBillingDetails((prev) => ({
      ...prev,
      streetAddress: "",
      apartment: "",
      townCity: "",
      companyName: "",
    }));
  };

  const handleSaveNewAddress = async () => {
    if (!isAuthenticated) return;

    try {
      const newAddress: Omit<UserAddress, "id" | "createdAt" | "updatedAt"> = {
        streetAddress: billingDetails.streetAddress,
        city: billingDetails.townCity,
        state: "Lagos", // Default for now - could be made dynamic
        zipCode: "100001", // Default for now - could be made dynamic
        country: "Nigeria",
        isDefault: saveInfo, // Use saveInfo checkbox to set as default
      };

      await addAddress(newAddress);
      setIsAddingNewAddress(false);
      setShowAddressForm(false);

      // Refresh addresses and select the new one
      const addresses = getAddresses();
      const newAddressFromList = addresses[addresses.length - 1]; // Assuming it's the last one
      if (newAddressFromList) {
        setSelectedAddress(newAddressFromList);
      }
    } catch (error) {
      console.error("Failed to save address:", error);
    }
  };

  // Coupon handling functions
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponError(null);

    // Mock coupon validation - replace with real API call
    const mockCoupons: Record<string, number> = {
      SAVE1000: 1000,
      DISCOUNT500: 500,
      WELCOME200: 200,
    };

    const discount = mockCoupons[couponCode.toUpperCase()];

    if (discount) {
      setAppliedCoupon(couponCode.toUpperCase());
      setCouponDiscount(discount);
      setCouponError(null);
    } else {
      setCouponError("Invalid coupon code");
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponError(null);
  };

  const handleInputChange = (
    field: keyof BillingDetailsForm,
    value: string
  ) => {
    setBillingDetails((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation errors for this field
    setValidationErrors((prev) =>
      prev.filter((error) => error.field !== field)
    );
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange("phoneNumber", formatted);
  };

  const getFieldError = (field: string) => {
    return validationErrors.find((error) => error.field === field)?.message;
  };

  const handlePlaceOrder = async () => {
    // Validate form
    const errors = validateBillingDetails(billingDetails);

    if (errors.length > 0) {
      // errors.forEach((err) => {
      //   notify({
      //     type: "error",
      //     message: err.message,
      //   });
      // });

      setValidationErrors(errors);

      // Scroll to first error
      const firstErrorField = document.querySelector(
        `[name="${errors[0].field}"]`
      );
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (!isAuthenticated) {
      alert("Please sign in to place an order");
      return;
    }

    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const billingData = transformBillingDetails(billingDetails);
      const orderItems = transformCartItemsToOrderItems(items);
      const paymentMethod = mapPaymentMethodToApi(selectedPayment);

      const checkoutRequest = {
        billing: billingData,
        orderItems,
        paymentMethod,
        ...(appliedCoupon && { couponCode: appliedCoupon }),
      };

      console.log("🛒 Placing order with data:", checkoutRequest);

      const response = await orderApi.checkout(checkoutRequest);

      console.log("🔍 Checkout response:", response);

      // SUCCESS RESPONSE (backend always returns error: false)
      if (response.error === false) {
        // Save order number
        if (response.orderNo) {
          setOrderNumber(response.orderNo);
        }

        // PAYSTACK REDIRECT URL
        if (response.paymentData?.authorizationUrl) {
          console.log(
            "🔁 Redirecting to Paystack:",
            response.paymentData.authorizationUrl
          );

          await clearAllItems(); // Optional
          window.location.href = response.paymentData.authorizationUrl;
          return;
        }

        // FALLBACK redirectUrl
        if (response.redirectUrl) {
          console.log("Redirecting:", response.redirectUrl);

          await clearAllItems();
          window.location.href = response.redirectUrl;
          return;
        }

        // No redirect → show success modal
        setShowSuccess(true);
        await clearAllItems();
        return;
      }

      // If API returned error = true
      throw new Error(response.message || "Failed to place order");
    } catch (error) {
      console.error("❌ Checkout failed:", error);

      const errorMessage = apiErrorUtils.getErrorMessage(error);

      alert(`Failed to place order: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate("/orders", {
      state: {
        orderPlaced: true,
        orderTotal: total,
        paymentMethod: selectedPayment,
        orderNumber: orderNumber,
      },
    });
  };

  const breadcrumbItems = [
    { label: "Account", href: "/account" },
    { label: "My Account", href: "/account" },
    { label: "Product", href: "/products" },
    { label: "View Cart", href: "/cart" },
    { label: "CheckOut", isCurrentPage: true },
  ];

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Add some items to your cart to proceed with checkout
            </p>
            <Button onClick={() => navigate("/products")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication options if not authenticated and not choosing guest checkout
  if (!isAuthenticated && !checkoutAsGuest) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Sign in to checkout
                </h2>
                <p className="text-gray-600 mb-8">
                  Sign in to your account for a faster checkout experience, or
                  continue as a guest.
                </p>

                <div className="space-y-4">
                  <Button asChild className="w-full" size="lg">
                    <Link to="/auth/login?redirect=/checkout">
                      <User className="w-5 h-5 mr-2" />
                      Sign In to Your Account
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => setCheckoutAsGuest(true)}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Continue as Guest
                  </Button>

                  <div className="text-sm text-gray-500">
                    Don't have an account?{" "}
                    <Link
                      to="/auth/register?redirect=/checkout"
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Create one now
                    </Link>
                  </div>
                </div>

                {/* Benefits of signing in */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Benefits of signing in:
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Faster checkout with saved information</li>
                    <li>• Order tracking and history</li>
                    <li>• Exclusive member offers</li>
                    <li>• Easy returns and exchanges</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-8" />

        {/* Guest Checkout Alert */}
        {!isAuthenticated && checkoutAsGuest && (
          <Alert className="mb-6">
            <User className="w-4 h-4" />
            <div>
              <p className="font-medium">Checking out as guest</p>
              <p className="text-sm text-gray-600">
                You can{" "}
                <Link
                  to="/auth/login?redirect=/checkout"
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  sign in
                </Link>{" "}
                or{" "}
                <Link
                  to="/auth/register?redirect=/checkout"
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  create an account
                </Link>{" "}
                for a better experience.
              </p>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Billing Details Form */}
          <div>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Billing Details
                  </h2>
                  {isAuthenticated && (
                    <div className="flex items-center text-sm text-green-600">
                      <User className="w-4 h-4 mr-1" />
                      Signed in as {user?.firstName}
                    </div>
                  )}
                </div>

                {/* Address Management Section */}
                {isAuthenticated && (
                  <div className="mb-6">
                    {selectedAddress &&
                      !showAddressForm &&
                      !showAddressSelector && (
                        <AddressSummary
                          address={selectedAddress}
                          onEdit={handleEditAddress}
                          onChangeAddress={
                            getAddresses().length > 1
                              ? handleChangeAddress
                              : undefined
                          }
                          showChangeOption={getAddresses().length > 1}
                        />
                      )}

                    {showAddressSelector && (
                      <AddressSelector
                        addresses={getAddresses()}
                        selectedAddressId={selectedAddress?.id || null}
                        onSelectAddress={handleSelectAddress}
                        onAddNew={handleAddNewAddress}
                        onCancel={() => {
                          setShowAddressSelector(false);
                          if (selectedAddress) {
                            setShowAddressForm(false);
                          }
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Show form if no address selected, editing, or guest checkout */}
                {showAddressForm && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name*
                      </label>
                      <Input
                        name="firstName"
                        value={billingDetails.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className={cn(
                          "w-full",
                          getFieldError("firstName") &&
                            "border-red-500 focus:ring-red-500"
                        )}
                        required
                      />
                      {getFieldError("firstName") && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {getFieldError("firstName")}
                        </div>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <Input
                        name="lastName"
                        value={billingDetails.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <Input
                        value={billingDetails.companyName}
                        onChange={(e) =>
                          handleInputChange("companyName", e.target.value)
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Street Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address*
                      </label>
                      <Input
                        name="streetAddress"
                        value={billingDetails.streetAddress}
                        onChange={(e) =>
                          handleInputChange("streetAddress", e.target.value)
                        }
                        className={cn(
                          "w-full",
                          getFieldError("streetAddress") &&
                            "border-red-500 focus:ring-red-500"
                        )}
                        required
                      />
                      {getFieldError("streetAddress") && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {getFieldError("streetAddress")}
                        </div>
                      )}
                    </div>

                    {/* Apartment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apartment, floor, etc. (optional)
                      </label>
                      <Input
                        value={billingDetails.apartment}
                        onChange={(e) =>
                          handleInputChange("apartment", e.target.value)
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Town/City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Town/City*
                      </label>
                      <Input
                        name="townCity"
                        value={billingDetails.townCity}
                        onChange={(e) =>
                          handleInputChange("townCity", e.target.value)
                        }
                        className={cn(
                          "w-full",
                          getFieldError("townCity") &&
                            "border-red-500 focus:ring-red-500"
                        )}
                        required
                      />
                      {getFieldError("townCity") && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {getFieldError("townCity")}
                        </div>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number*
                      </label>
                      <Input
                        name="phoneNumber"
                        type="tel"
                        value={billingDetails.phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={cn(
                          "w-full",
                          getFieldError("phoneNumber") &&
                            "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="(555) 123-4567"
                        required
                      />
                      {getFieldError("phoneNumber") && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {getFieldError("phoneNumber")}
                        </div>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address*
                      </label>
                      <Input
                        name="emailAddress"
                        type="email"
                        value={billingDetails.emailAddress}
                        onChange={(e) =>
                          handleInputChange("emailAddress", e.target.value)
                        }
                        className={cn(
                          "w-full",
                          getFieldError("emailAddress") &&
                            "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="john@example.com"
                        required
                      />
                      {getFieldError("emailAddress") && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {getFieldError("emailAddress")}
                        </div>
                      )}
                    </div>

                    {/* Save address options */}
                    {isAuthenticated &&
                      (showAddressForm || isAddingNewAddress) && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center space-x-2">
                            <input
                              id="save-address"
                              name="save-address"
                              type="checkbox"
                              checked={saveInfo}
                              onChange={(e) => setSaveInfo(e.target.checked)}
                              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                            />
                            <label
                              htmlFor="save-address"
                              className="text-sm text-gray-700"
                            >
                              {isAddingNewAddress
                                ? "Save as new address"
                                : "Update my saved address"}
                            </label>
                          </div>

                          {isAddingNewAddress && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleSaveNewAddress}
                              className="flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Save Address
                            </Button>
                          )}
                        </div>
                      )}

                    {/* Guest save info checkbox */}
                    {!isAuthenticated && checkoutAsGuest && (
                      <div className="flex items-center space-x-2 pt-4">
                        <input
                          id="save-info"
                          name="save-info"
                          type="checkbox"
                          checked={saveInfo}
                          onChange={(e) => setSaveInfo(e.target.checked)}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                        />
                        <label
                          htmlFor="save-info"
                          className="text-sm text-gray-700"
                        >
                          Save this information for faster check-out next time
                        </label>
                      </div>
                    )}

                    {/* Guest checkout account creation suggestion */}
                    {!isAuthenticated && checkoutAsGuest && (
                      <div className="pt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Create an account?
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Save your information and get faster checkout, order
                          tracking, and exclusive offers.
                        </p>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/auth/register?redirect=/checkout">
                            Create Account
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Address summary for non-form view */}
                {isAuthenticated &&
                  selectedAddress &&
                  !showAddressForm &&
                  !showAddressSelector && (
                    <div className="pt-4 text-sm text-muted-foreground">
                      <p>✓ Using saved address for billing information</p>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              discount={discount}
              total={total}
              appliedCoupon={appliedCoupon}
              showTitle={false}
            />

            {/* Coupon Code Section */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Coupon Code
                </h3>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">
                        Coupon "{appliedCoupon}" applied
                      </span>
                      <span className="text-sm text-green-600">
                        (-
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                        }).format(couponDiscount)}
                        )
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        className="flex-1"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleApplyCoupon()
                        }
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>

                    {couponError && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {couponError}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Try: SAVE1000, DISCOUNT500, WELCOME200
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6">
                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Payment Method
                  </h3>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                          selectedPayment === method.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selectedPayment === method.id}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                        />
                        <div className="flex items-center space-x-2">
                          {method.icon}
                          <span className="text-sm font-medium">
                            {method.name}
                          </span>
                        </div>
                        {method.id === "bank-card" && (
                          <div className="ml-auto flex space-x-1">
                            <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                              VISA
                            </div>
                            <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                              MC
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <CheckoutSuccess
            orderNumber={orderNumber}
            orderTotal={total}
            paymentMethod={selectedPayment}
            onClose={handleSuccessClose}
          />
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
