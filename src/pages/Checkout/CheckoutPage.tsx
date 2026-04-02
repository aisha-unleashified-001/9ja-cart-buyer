import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import visaLogo from "@/assets/payment-logos/visa-logo.png";
import mastercardLogo from "@/assets/payment-logos/mastercard-logo.png";
import {
  CreditCard,
  Truck,
  Shield,
  AlertCircle,
  User,
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
  validateCheckoutAccountPassword,
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
import { formatPrice } from "../../lib/productUtils";
import type { UserAddress } from "../../types";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const CHECKOUT_GUEST_PARAM = "guest";

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { items, availableItems, subtotal, shipping: cartShipping, flatRate, finalTotal, clearAllItems, isLoading } = useCart();

  const { isAuthenticated, user, register } = useAuthStore();
  const { profile, fetchProfile, getDefaultAddress, getAddresses, addAddress } =
    useProfile();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("bank-card");
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const checkoutAsGuest =
    searchParams.get(CHECKOUT_GUEST_PARAM) === "1" && !isAuthenticated;

  const [guestWantsAccount, setGuestWantsAccount] = useState(false);
  const [guestPassword, setGuestPassword] = useState("");
  const [guestConfirmPassword, setGuestConfirmPassword] = useState("");
  /** Used when saving a new address for signed-in users (set as default). */
  const [newAddressAsDefault, setNewAddressAsDefault] = useState(false);

  // Address management state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null
  );
  const [addressSavedSuccess, setAddressSavedSuccess] = useState(false);
  const [addressSaveError, setAddressSaveError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const justSavedAddressRef = useRef(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [billingDetails, setBillingDetails] = useState<BillingDetailsForm>({
    firstName: "",
    lastName: "",
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
    // Skip if we just saved an address - preserve current form values
    if (justSavedAddressRef.current) {
      justSavedAddressRef.current = false;
      return;
    }

    if (isAuthenticated && profile) {
      const defaultAddress = getDefaultAddress();

      if (defaultAddress && isInitialLoad) {
        setSelectedAddress(defaultAddress);
        // Auto-fill form with default address - ensure all required fields are populated
        setBillingDetails((prev) => ({
          ...prev,
          firstName: user?.firstName || profile.firstName || prev.firstName || "",
          lastName: user?.lastName || profile.lastName || prev.lastName || "",
          emailAddress: user?.email || profile.email || prev.emailAddress || "",
          phoneNumber: user?.phone || profile.phone || prev.phoneNumber || "",
          streetAddress: defaultAddress.streetAddress || prev.streetAddress || "",
          townCity: defaultAddress.city || prev.townCity || "",
          apartment: prev.apartment || "",
        }));
        setShowAddressForm(false); // Hide form since we have default address
        setIsInitialLoad(false);
      } else if (isInitialLoad) {
        // No default address, show form
        setShowAddressForm(true);
        setBillingDetails((prev) => ({
          ...prev,
          firstName: user?.firstName || profile.firstName || prev.firstName || "",
          lastName: user?.lastName || profile.lastName || prev.lastName || "",
          emailAddress: user?.email || profile.email || prev.emailAddress || "",
          phoneNumber: user?.phone || profile.phone || prev.phoneNumber || "",
        }));
        setIsInitialLoad(false);
      }
    } else if (!isAuthenticated && checkoutAsGuest) {
      // Guest checkout - always show form
      setShowAddressForm(true);
      setIsInitialLoad(false);
    }
  }, [isAuthenticated, profile, user, checkoutAsGuest, getDefaultAddress, isInitialLoad]);

  const paymentMethods: PaymentMethod[] = [
    {
      id: "bank-card",
      name: "Bank/Card",
      icon: <CreditCard className="w-5 h-5" />,
      disabled: false,
    },
    {
      id: "cash-on-delivery",
      name: "Pay on delivery",
      icon: <Truck className="w-5 h-5" />,
      disabled: true,
    },
    {
      id: "buy-now-pay-later",
      name: "Buy Now, Pay Later",
      icon: <Shield className="w-5 h-5" />,
      disabled: true,
    },
    // Hidden for now - Emergency Credit
    // {
    //   id: "emergency-credit",
    //   name: "Emergency Credit",
    //   icon: <Shield className="w-5 h-5" />,
    //   disabled: true,
    // },
  ];

  // Use filtered values from cart (already exclude unavailable products)
  const cartSubtotal = subtotal; // Use filtered subtotal from cart
  const shipping = cartShipping; // Use shipping from cart (already calculated based on filtered items)
  const discount = couponDiscount;
  const total = finalTotal - discount; // Use finalTotal from cart (already includes subtotal + shipping + commission)

  // Address management functions
  const handleEditAddress = () => {
    setShowAddressForm(true);
    setShowAddressSelector(false);
    setAddressSavedSuccess(false);
    setAddressSaveError(null);
    // Ensure form is populated with current selected address data
    if (selectedAddress) {
      setBillingDetails((prev) => ({
        ...prev,
        // Preserve all existing form values (phone, email, etc.)
        streetAddress: selectedAddress.streetAddress || prev.streetAddress || "",
        townCity: selectedAddress.city || prev.townCity || "",
        // Keep all other fields as they are
      }));
    }
  };

  const handleChangeAddress = () => {
    setShowAddressSelector(true);
    setShowAddressForm(false);
    setAddressSavedSuccess(false);
    setAddressSaveError(null);
  };

  const handleSelectAddress = (address: UserAddress) => {
    setSelectedAddress(address);
    // Update billing details with selected address - preserve ALL current form values
    // Only update address-specific fields (streetAddress, townCity)
    setBillingDetails((prev) => ({
      ...prev,
      // Preserve all existing form values, only update address fields
      streetAddress: address.streetAddress || prev.streetAddress || "",
      townCity: address.city || prev.townCity || "",
      // Ensure other fields are populated if empty, but preserve existing values first
      firstName: prev.firstName || user?.firstName || profile?.firstName || "",
      lastName: prev.lastName || user?.lastName || profile?.lastName || "",
      emailAddress: prev.emailAddress || user?.email || profile?.email || "",
      phoneNumber: prev.phoneNumber || user?.phone || profile?.phone || "",
      apartment: prev.apartment || "",
    }));
    setShowAddressSelector(false);
    setShowAddressForm(false);
  };

  const handleAddNewAddress = () => {
    setShowAddressSelector(false);
    setShowAddressForm(true);
    setAddressSavedSuccess(false);
    setAddressSaveError(null);
    // Clear form for new address
    setBillingDetails((prev) => ({
      ...prev,
      streetAddress: "",
      apartment: "",
      townCity: "",
    }));
  };

  const handleSaveNewAddress = async () => {
    if (!isAuthenticated) return;

    // Clear previous errors
    setAddressSaveError(null);
    setAddressSavedSuccess(false);

    if (!billingDetails.streetAddress?.trim() || !billingDetails.townCity?.trim()) {
      setAddressSaveError("Please enter street address and city.");
      return;
    }

    try {
      const newAddress: Omit<UserAddress, "id" | "createdAt" | "updatedAt"> = {
        streetAddress: billingDetails.streetAddress.trim(),
        city: billingDetails.townCity.trim(),
        state: "Lagos", // Default for now - could be made dynamic
        zipCode: "100001", // Default for now - could be made dynamic
        country: "Nigeria",
        isDefault: newAddressAsDefault,
      };

      await addAddress(newAddress);
      
      // Set flag to prevent useEffect from resetting form
      justSavedAddressRef.current = true;
      
      // Show success message and keep form open with current values
      setAddressSavedSuccess(true);
      setAddressSaveError(null);
      setShowAddressForm(true); // Explicitly keep form open
      setShowAddressSelector(false); // Don't show address selector
      
      // Refresh addresses (this might trigger profile update, but we've set the flag)
      getAddresses();
    } catch (error) {
      console.error("Failed to save address:", error);
      setAddressSavedSuccess(false);
      justSavedAddressRef.current = false;
      
      // Extract user-friendly error message
      const errorMessage = apiErrorUtils.getErrorMessage(error);
      setAddressSaveError(errorMessage);
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

  const isGuestCheckoutFlow = !isAuthenticated && checkoutAsGuest;
  const CHECKOUT_VERIFY_REDIRECT_FLAG = "checkout_verify_email_after_payment";

  const persistGuestRegisterPrefill = () => {
    if (!isGuestCheckoutFlow || !guestWantsAccount) return;
    try {
      sessionStorage.setItem(
        "checkout_register_prefill",
        JSON.stringify({
          email: billingDetails.emailAddress.trim(),
          firstName: billingDetails.firstName.trim(),
          lastName: billingDetails.lastName.trim(),
        })
      );
    } catch {
      /* ignore quota / private mode */
    }
  };

  const prepareGuestAccountForPostPayment = async () => {
    if (
      !isGuestCheckoutFlow ||
      !guestWantsAccount ||
      !guestPassword.trim()
    ) {
      return;
    }

    try {
      await register({
        firstName: billingDetails.firstName.trim(),
        lastName:
          billingDetails.lastName.trim() || billingDetails.firstName.trim(),
        email: billingDetails.emailAddress.trim(),
        password: guestPassword,
      });
      sessionStorage.setItem(CHECKOUT_VERIFY_REDIRECT_FLAG, "1");
    } catch (regErr) {
      const regMsg = apiErrorUtils.getErrorMessage(regErr);
      alert(
        `Your order was created, but we could not prepare account verification: ${regMsg}. You can still sign up with this email from the login page.`
      );
    }
  };

  const handlePlaceOrder = async () => {
    // Check if cart is empty first (only check available items)
    if (availableItems.length === 0) {
      alert("Your cart is empty. Please add items to your cart before placing an order.");
      navigate("/products");
      return;
    }

    if (!isAuthenticated && !checkoutAsGuest) {
      navigate("/auth/login?redirect=/checkout");
      return;
    }

    const phoneOptional = isGuestCheckoutFlow;

    // Show form if hidden and validation is needed
    if (
      !showAddressForm &&
      (!billingDetails.firstName ||
        !billingDetails.emailAddress ||
        (!phoneOptional && !billingDetails.phoneNumber))
    ) {
      setShowAddressForm(true);
    }

    const errors = validateBillingDetails(billingDetails, {
      phoneOptional,
    });

    if (isGuestCheckoutFlow && guestWantsAccount) {
      if (!guestPassword.trim()) {
        errors.push({
          field: "guestPassword",
          message: "Password is required to create an account",
        });
      } else {
        const pwdMsg = validateCheckoutAccountPassword(guestPassword);
        if (pwdMsg) {
          errors.push({ field: "guestPassword", message: pwdMsg });
        } else if (guestPassword !== guestConfirmPassword) {
          errors.push({
            field: "guestConfirmPassword",
            message: "Passwords don't match",
          });
        }
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowAddressForm(true);

      setTimeout(() => {
        const firstErrorField = document.querySelector(
          `[name="${errors[0].field}"]`
        );
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
          (firstErrorField as HTMLElement).focus();
        }
      }, 100);

      return;
    }

    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const billingData = transformBillingDetails(billingDetails);
      const orderItems = transformCartItemsToOrderItems(availableItems);
      const paymentMethod = mapPaymentMethodToApi(selectedPayment);

      if (!orderItems || orderItems.length === 0) {
        throw new Error("No items in order. Please add items to your cart.");
      }

      if (
        !billingData.firstName ||
        !billingData.emailAddress ||
        !billingData.streetAddress ||
        !billingData.city
      ) {
        throw new Error("Please complete all required billing information.");
      }

      if (!phoneOptional && !billingData.phoneNumber?.trim()) {
        throw new Error("Please complete all required billing information.");
      }

      const checkoutRequest = {
        billing: billingData,
        orderItems,
        paymentMethod,
        ...(isGuestCheckoutFlow && { guestCheckout: 1 }),
        ...(!isGuestCheckoutFlow && user?.id && { buyerId: user.id }),
        ...(appliedCoupon && { couponCode: appliedCoupon }),
      };

      const response = isGuestCheckoutFlow
        ? await orderApi.checkoutAsGuest(checkoutRequest)
        : await orderApi.checkout(checkoutRequest);

      if (response.error === false) {
        if (response.orderNo) {
          setOrderNumber(response.orderNo);
        }

        if (response.paymentData?.authorizationUrl) {
          persistGuestRegisterPrefill();
          await prepareGuestAccountForPostPayment();
          setIsRedirectingToPayment(true);
          await clearAllItems();
          window.location.href = response.paymentData.authorizationUrl;
          return;
        }

        if (response.redirectUrl) {
          persistGuestRegisterPrefill();
          await prepareGuestAccountForPostPayment();
          setIsRedirectingToPayment(true);
          await clearAllItems();
          window.location.href = response.redirectUrl;
          return;
        }

        await clearAllItems();

        if (
          isGuestCheckoutFlow &&
          guestWantsAccount &&
          guestPassword.trim()
        ) {
          try {
            await register({
              firstName: billingDetails.firstName.trim(),
              lastName:
                billingDetails.lastName.trim() || billingDetails.firstName.trim(),
              email: billingDetails.emailAddress.trim(),
              password: guestPassword,
            });
            navigate("/auth/registration-success");
            return;
          } catch (regErr) {
            const regMsg = apiErrorUtils.getErrorMessage(regErr);
            alert(
              `Your order was placed. We could not create your account: ${regMsg}. You can still sign up with this email from the login page.`
            );
          }
        }

        setShowSuccess(true);
        return;
      }

      throw new Error(response.message || "Failed to place order");
    } catch (error) {
      console.error("❌ Checkout failed:", error);

      const errorMessage = apiErrorUtils.getErrorMessage(error);
      const errorDetails = error instanceof Error ? error.message : errorMessage;
      alert(`Failed to place order: ${errorDetails}\n\nPlease check your information and try again.`);

      if (
        !isGuestCheckoutFlow &&
        (errorMessage.includes("Authentication") ||
          errorMessage.includes("401") ||
          errorMessage.includes("token"))
      ) {
        setTimeout(() => {
          navigate("/auth/login?redirect=/checkout");
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    if (isAuthenticated) {
      navigate("/orders", {
        state: {
          orderPlaced: true,
          orderTotal: total,
          paymentMethod: selectedPayment,
          orderNumber: orderNumber,
        },
      });
    } else {
      navigate("/");
    }
  };

  const breadcrumbItems = [
    { label: "Account", href: "/account" },
    { label: "My Account", href: "/account" },
    { label: "Product", href: "/products" },
    { label: "View Cart", href: "/cart" },
    { label: "Checkout", isCurrentPage: true },
  ];

  // Show loading state while cart is being fetched or redirecting to payment
  if (isLoading || isRedirectingToPayment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          <div className="text-center py-16">
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#182F38] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">
                {isRedirectingToPayment 
                  ? "Redirecting to payment..." 
                  : "Loading your cart..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show empty cart message after loading is complete
  // Don't show empty cart page if we're redirecting to payment (prevents flash before Paystack redirect)
  if (!isLoading && items.length === 0 && !isRedirectingToPayment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gray-50 py-8 max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumbItems} className="mb-8" />

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  How would you like to checkout?
                </h2>
                <p className="text-gray-600 mb-8">
                  Sign in for saved addresses and order history, or continue as a
                  guest with your email and shipping details.
                </p>

                <div className="space-y-4">
                  <Button asChild className="w-full" size="lg">
                    <Link
                      to="/auth/login?redirect=/checkout"
                      className="flex items-center justify-center"
                    >
                      <User className="w-5 h-5 mr-2" />
                      Sign in
                    </Link>
                  </Button>

                  <Button asChild className="w-full" size="lg" variant="outline">
                    <Link
                      to="/auth/register?redirect=/checkout"
                      className="flex items-center justify-center"
                    >
                      Sign up
                    </Link>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set(CHECKOUT_GUEST_PARAM, "1");
                        return next;
                      });
                    }}
                  >
                    Continue as guest
                  </Button>
                </div>

                {/* Benefits of signing in */}
                <div className="mt-8 p-4 bg-[#1E4700]/10 rounded-lg text-left">
                  <h4 className="font-medium text-[#1E4700] mb-2">
                    Benefits of signing in:
                  </h4>
                  <ul className="text-sm text-[#1E4700] space-y-1">
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
    <div className="min-h-screen bg-gray-50 py-8 max-w-[960px] lg:max-w-7xl 2xl:max-w-[1550px] mx-auto">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
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
                  className="text-[#1E4700] hover:text-[#1E4700]/80 font-medium"
                >
                  sign in
                </Link>{" "}
                or{" "}
                <Link
                  to="/auth/register?redirect=/checkout"
                  className="text-[#1E4700] hover:text-[#1E4700]/80 font-medium"
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
                    Shipping Details
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
                    {!isAuthenticated && checkoutAsGuest ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full name*
                        </label>
                        <Input
                          name="firstName"
                          value={
                            [billingDetails.firstName, billingDetails.lastName]
                              .filter(Boolean)
                              .join(" ") || ""
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            const parts = raw
                              .trim()
                              .split(/\s+/)
                              .filter(Boolean);
                            setBillingDetails((prev) => ({
                              ...prev,
                              firstName: parts[0] ?? "",
                              lastName: parts.slice(1).join(" "),
                            }));
                            setValidationErrors((prev) =>
                              prev.filter((err) => err.field !== "firstName")
                            );
                          }}
                          className={cn(
                            "w-full !border-gray-400",
                            getFieldError("firstName") &&
                              "border-red-500 focus:ring-red-500"
                          )}
                          placeholder="e.g. Adaobi Okonkwo"
                          autoComplete="name"
                          required
                        />
                        {getFieldError("firstName") && (
                          <div className="flex items-center mt-1 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {getFieldError("firstName")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
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
                              "w-full !border-gray-400",
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
                            className="w-full !border-gray-400"
                          />
                        </div>
                      </>
                    )}

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
                          "w-full !border-gray-400",
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
                        className="w-full !border-gray-400"
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
                          "w-full !border-gray-400",
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
                        Phone number
                        {!isAuthenticated && checkoutAsGuest ? (
                          <span className="text-gray-500 font-normal">
                            {" "}
                            (optional)
                          </span>
                        ) : (
                          <span>*</span>
                        )}
                      </label>
                      <Input
                        name="phoneNumber"
                        type="tel"
                        value={billingDetails.phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={cn(
                          "w-full !border-gray-400",
                          getFieldError("phoneNumber") &&
                            "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="+2348000000000"
                        required={!(!isAuthenticated && checkoutAsGuest)}
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
                          "w-full !border-gray-400",
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
                    {isAuthenticated && showAddressForm && (
                        <div className="pt-4">
                          {addressSavedSuccess && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-800">
                                Your address have being saved, you can access it on your profile
                              </p>
                            </div>
                          )}
                          {addressSaveError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 text-sm text-red-800">
                                <AlertCircle className="w-4 h-4" />
                                {addressSaveError}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pb-3">
                            <input
                              id="address-default"
                              type="checkbox"
                              checked={newAddressAsDefault}
                              onChange={(e) =>
                                setNewAddressAsDefault(e.target.checked)
                              }
                              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                            />
                            <label
                              htmlFor="address-default"
                              className="text-sm text-gray-700"
                            >
                              Set as default address
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
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

                            {getAddresses().length > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleChangeAddress}
                                className="flex items-center gap-1 bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary"
                              >
                                Choose existing Address
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Guest: optional account creation (password → signup / OTP flow) */}
                    {!isAuthenticated && checkoutAsGuest && (
                      <div className="pt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                        <div className="flex items-start space-x-2">
                          <input
                            id="guest-create-account"
                            type="checkbox"
                            checked={guestWantsAccount}
                            onChange={(e) => {
                              setGuestWantsAccount(e.target.checked);
                              if (!e.target.checked) {
                                setGuestPassword("");
                                setGuestConfirmPassword("");
                              }
                              setValidationErrors((prev) =>
                                prev.filter(
                                  (err) =>
                                    err.field !== "guestPassword" &&
                                    err.field !== "guestConfirmPassword"
                                )
                              );
                            }}
                            className="w-4 h-4 mt-0.5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                          <label
                            htmlFor="guest-create-account"
                            className="text-sm text-gray-700"
                          >
                            Create an account with this email after placing the
                            order (order confirmation email will still be sent to
                            this address).
                          </label>
                        </div>
                        {guestWantsAccount && (
                          <div className="space-y-3 pl-0 sm:pl-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password*
                              </label>
                              <Input
                                name="guestPassword"
                                type="password"
                                autoComplete="new-password"
                                value={guestPassword}
                                onChange={(e) => {
                                  setGuestPassword(e.target.value);
                                  setValidationErrors((prev) =>
                                    prev.filter(
                                      (err) => err.field !== "guestPassword"
                                    )
                                  );
                                }}
                                className={cn(
                                  "w-full !border-gray-400",
                                  getFieldError("guestPassword") &&
                                    "border-red-500 focus:ring-red-500"
                                )}
                              />
                              {getFieldError("guestPassword") && (
                                <div className="flex items-center mt-1 text-sm text-red-600">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  {getFieldError("guestPassword")}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm password*
                              </label>
                              <Input
                                name="guestConfirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={guestConfirmPassword}
                                onChange={(e) => {
                                  setGuestConfirmPassword(e.target.value);
                                  setValidationErrors((prev) =>
                                    prev.filter(
                                      (err) =>
                                        err.field !== "guestConfirmPassword"
                                    )
                                  );
                                }}
                                className={cn(
                                  "w-full !border-gray-400",
                                  getFieldError("guestConfirmPassword") &&
                                    "border-red-500 focus:ring-red-500"
                                )}
                              />
                              {getFieldError("guestConfirmPassword") && (
                                <div className="flex items-center mt-1 text-sm text-red-600">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  {getFieldError("guestConfirmPassword")}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              Same password rules as sign up: upper & lowercase,
                              number, and a special character (!@$%&*?).
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-gray-600">
                          Prefer to register separately?{" "}
                          <Link
                            to="/auth/register?redirect=/checkout"
                            className="text-[#1E4700] hover:text-[#1E4700]/80 font-medium"
                          >
                            Create an account
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <OrderSummary
              items={availableItems}
              subtotal={cartSubtotal}
              shipping={shipping}
              flatRate={flatRate}
              tax={0}
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
                        (-{formatPrice(couponDiscount)})
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
                    {paymentMethods.map((method) => {
                      const isDisabled = method.disabled;
                      return (
                        <div
                          key={method.id}
                          className="relative group"
                        >
                          <label
                            className={cn(
                              "flex items-center space-x-3 p-3 border rounded-lg transition-colors",
                              isDisabled
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer",
                              selectedPayment === method.id && !isDisabled
                                ? "border-green-500 bg-green-50"
                                : isDisabled
                                ? "border-gray-200"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={(e) => {
                              if (isDisabled) {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={method.id}
                              checked={selectedPayment === method.id}
                              onChange={(e) => {
                                if (!isDisabled) {
                                  setSelectedPayment(e.target.value);
                                }
                              }}
                              disabled={isDisabled}
                              className={cn(
                                "w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2",
                                isDisabled && "cursor-not-allowed"
                              )}
                            />
                            <div className="flex items-center space-x-2">
                              {method.icon}
                              <span className="text-sm font-medium">
                                {method.name}
                              </span>
                            </div>
                            {method.id === "bank-card" && (
                              <div className="ml-auto flex items-center gap-1.5">
                                <img
                                  src={visaLogo}
                                  alt="Visa"
                                  className="h-5 w-auto object-contain"
                                />
                                <img
                                  src={mastercardLogo}
                                  alt="Mastercard"
                                  className="h-7 w-auto object-contain"
                                />
                              </div>
                            )}
                          </label>
                          {isDisabled && (
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                              feature coming soon
                              <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full mt-8 bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary py-3 text-base font-medium border border-[#2ac12a]"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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
            isGuest={isGuestCheckoutFlow}
            onClose={handleSuccessClose}
          />
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
