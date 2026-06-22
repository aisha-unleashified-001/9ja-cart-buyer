import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import visaLogo from "@/assets/payment-logos/visa-logo.png";
import mastercardLogo from "@/assets/payment-logos/mastercard-logo.png";
import wakaLineLogoWhite from "@/assets/mywakawaka-logo-white.png";
import { init as initBnplWidget } from "@neocash/bnpl-widget";
import type { WidgetHandle } from "@neocash/bnpl-widget";
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
import { useDeliveryValidation } from "../../hooks/useDeliveryValidation";
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
  parseValidateDeliveryResponse,
  expandCartItemsForValidateDelivery,
  inferMixedDeliveryCase,
} from "../../api/order";
import { useCheckoutCouponStore } from "../../store/useCheckoutCouponStore";
import { apiErrorUtils } from "../../utils/api-errors";
import { cn } from "../../lib/utils";
import { formatPrice } from "../../lib/productUtils";
import { config } from "../../lib/config";
import { BNPL_WIDGET_THEME, buildPartnerPrefill } from "../../lib/bnplWidget";
import type { UserAddress } from "../../types";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const CHECKOUT_GUEST_PARAM = "guest";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

function buildBuyerAddressLine(
  billing: BillingDetailsForm,
  selectedAddress: UserAddress | null
): string {
  const normalizedBillingState = billing.townCity?.trim().toLowerCase();
  const normalizedSelectedState = selectedAddress?.state?.trim().toLowerCase();
  const parts = [
    billing.streetAddress?.trim(),
    billing.apartment?.trim(),
    billing.townCity?.trim(),
    normalizedSelectedState && normalizedSelectedState !== normalizedBillingState
      ? selectedAddress?.state?.trim()
      : "",
  ].filter(Boolean);
  return parts.join(", ");
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { items, availableItems, shipping: cartShipping, flatRate, clearAllItems, isLoading } = useCart();

  const { isAuthenticated, user } = useAuthStore();
  const { profile, fetchProfile, getDefaultAddress, getAddresses, addAddress } =
    useProfile();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("bank-card");
  const bnplWidgetHandleRef = useRef<WidgetHandle | null>(null);
  const bnplApplicationIdRef = useRef<string | null>(null);
  // Kept in a ref so the widget callbacks always see the latest version
  // without the widget needing to be re-initialised on every render.
  const handlePlaceOrderRef = useRef<(() => Promise<void>) | null>(null);
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

  // Coupon state (persisted in session for cart â†” checkout)
  const appliedCoupon = useCheckoutCouponStore((s) => s.appliedCoupon);
  const couponPricingSnapshot = useCheckoutCouponStore((s) => s.pricingSnapshot);
  const setPersistedCoupon = useCheckoutCouponStore((s) => s.setPersistedCoupon);
  const clearPersistedCoupon = useCheckoutCouponStore((s) => s.clearPersistedCoupon);

  const [couponCode, setCouponCode] = useState("");
  const couponDiscount = couponPricingSnapshot?.discountAmount ?? 0;
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCouponApplying, setIsCouponApplying] = useState(false);
  const [isCouponRemoving, setIsCouponRemoving] = useState(false);
  const couponHydrateAttemptedRef = useRef<string | null>(null);

  /** Product IDs excluded from this checkout only (remain in cart). */
  const [checkoutExcludedProductIds, setCheckoutExcludedProductIds] = useState<
    string[]
  >([]);
  const [isValidatingDelivery, setIsValidatingDelivery] = useState(false);

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
          townCity: defaultAddress.state || prev.townCity || "",
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
      disabled: false,
    },
    // Hidden for now - Emergency Credit
    // {
    //   id: "emergency-credit",
    //   name: "Emergency Credit",
    //   icon: <Shield className="w-5 h-5" />,
    //   disabled: true,
    // },
  ];

  // Use filtered values from cart (already exclude unavailable products).
  // When `couponPricingSnapshot` is set, discount is already reflected in `payableSubtotal` (API `cartSummary.total`).
  const summaryDiscount = couponPricingSnapshot ? 0 : couponDiscount;

  const checkoutExcludedSet = useMemo(
    () => new Set(checkoutExcludedProductIds),
    [checkoutExcludedProductIds]
  );

  const itemsForCheckout = useMemo(
    () =>
      availableItems.filter((i) => !checkoutExcludedSet.has(i.product.id)),
    [availableItems, checkoutExcludedSet]
  );

  const heavyCheckoutItems = useMemo(
    () =>
      itemsForCheckout.filter((item) => (item.product.shipping.weight ?? 0) > 10),
    [itemsForCheckout]
  );
  const hasHeavyProductInCheckout = heavyCheckoutItems.length > 0;

  const cartSubtotal = useMemo(() => {
    return itemsForCheckout.reduce((acc, item) => {
      const price =
        typeof item.product.price === "number"
          ? item.product.price
          : item.product.price.current;
      return acc + price * item.quantity;
    }, 0);
  }, [itemsForCheckout]);

  const merchandiseSubtotal =
    couponPricingSnapshot?.payableSubtotal ?? cartSubtotal;

  const buyerAddressForDelivery = useMemo(
    () => buildBuyerAddressLine(billingDetails, selectedAddress),
    [billingDetails, selectedAddress]
  );

  const canRunDeliveryValidation =
    itemsForCheckout.length > 0 &&
    Boolean(
      billingDetails.streetAddress?.trim() &&
        billingDetails.townCity?.trim()
    );

  const {
    validation: deliveryValidation,
    error: deliveryValidationError,
    isLoading: isDeliveryValidationLoading,
    refresh: refreshDeliveryValidation,
  } = useDeliveryValidation({
    buyerAddress: buyerAddressForDelivery,
    cartLineItems: itemsForCheckout,
    enabled: canRunDeliveryValidation,
  });

  const highlightProductIdsForSummary = useMemo(() => {
    if (!deliveryValidation?.affectedProductIds.length) return [];
    const af = new Set(deliveryValidation.affectedProductIds);
    return itemsForCheckout
      .filter((i) => af.has(i.product.id))
      .map((i) => i.product.id);
  }, [deliveryValidation, itemsForCheckout]);

  const inferredMixedDelivery = useMemo(
    () =>
      inferMixedDeliveryCase(
        deliveryValidation?.affectedProductIds ?? [],
        itemsForCheckout.map((i) => i.product.id)
      ),
    [deliveryValidation?.affectedProductIds, itemsForCheckout]
  );

  const showMixedCartBanner =
    highlightProductIdsForSummary.length > 0 &&
    (Boolean(deliveryValidation?.isMixedCart) || inferredMixedDelivery);

  const showAutomatedDeliveryUi =
    Boolean(deliveryValidation?.automatedDeliveryEligible) &&
    !deliveryValidation?.isMixedCart &&
    !deliveryValidation?.manualDeliveryRequired &&
    !inferredMixedDelivery;

  const shipping = useMemo(() => {
    const scenario = (deliveryValidation?.scenario ?? "").toUpperCase();
    const fee = deliveryValidation?.automatedDeliveryFee;
    if (
      scenario === "D" &&
      showAutomatedDeliveryUi &&
      typeof fee === "number" &&
      Number.isFinite(fee) &&
      fee > 0
    ) {
      return fee;
    }
    return cartShipping;
  }, [deliveryValidation?.scenario, deliveryValidation?.automatedDeliveryFee, showAutomatedDeliveryUi, cartShipping]);

  const total = merchandiseSubtotal + shipping + flatRate - summaryDiscount;

  useEffect(() => {
    if (!appliedCoupon || !couponPricingSnapshot) return;
    const drift = Math.abs(
      cartSubtotal - couponPricingSnapshot.preDiscountSubtotal
    );
    if (drift <= 1) return;
    clearPersistedCoupon();
    setCouponError(
      "Cart changed â€” please re-apply your coupon if you still want the discount."
    );
  }, [appliedCoupon, couponPricingSnapshot, cartSubtotal, clearPersistedCoupon]);

  const hideManualDeliveryUi =
    checkoutExcludedProductIds.length > 0 && !showMixedCartBanner;

  const shouldShowDeliveryCard =
    Boolean(deliveryValidationError) ||
    (Boolean(deliveryValidation) &&
      (showAutomatedDeliveryUi || !hideManualDeliveryUi));

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
        townCity: selectedAddress.state || prev.townCity || "",
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
      townCity: address.state || prev.townCity || "",
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
      setAddressSaveError("Please enter street address and state.");
      return;
    }

    try {
      const newAddress: Omit<UserAddress, "id" | "createdAt" | "updatedAt"> = {
        streetAddress: billingDetails.streetAddress.trim(),
        city: billingDetails.townCity.trim(),
        state: billingDetails.townCity.trim(),
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

  const handleApplyCoupon = async () => {
    const trimmed = couponCode.trim();
    if (!trimmed) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponError(null);

    if (isGuestCheckoutFlow) {
      setPersistedCoupon(trimmed, null);
      return;
    }

    setIsCouponApplying(true);
    try {
      const snapshot = await orderApi.applyCoupon(trimmed);
      setPersistedCoupon(trimmed, snapshot);
    } catch (e) {
      clearPersistedCoupon();
      setCouponError(apiErrorUtils.getErrorMessage(e));
    } finally {
      setIsCouponApplying(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (isGuestCheckoutFlow) {
      clearPersistedCoupon();
      setCouponCode("");
      setCouponError(null);
      return;
    }

    setIsCouponRemoving(true);
    setCouponError(null);
    try {
      await orderApi.removeCoupon();
      clearPersistedCoupon();
      setCouponCode("");
    } catch (e) {
      setCouponError(apiErrorUtils.getErrorMessage(e));
    } finally {
      setIsCouponRemoving(false);
    }
  };

  useEffect(() => {
    if (!appliedCoupon) {
      couponHydrateAttemptedRef.current = null;
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (!isAuthenticated || isGuestCheckoutFlow) return;
    if (!appliedCoupon || couponPricingSnapshot) return;
    if (availableItems.length === 0) return;
    if (couponHydrateAttemptedRef.current === appliedCoupon) return;
    couponHydrateAttemptedRef.current = appliedCoupon;

    let cancelled = false;
    void (async () => {
      try {
        const snapshot = await orderApi.applyCoupon(appliedCoupon);
        if (cancelled) return;
        setPersistedCoupon(appliedCoupon, snapshot);
      } catch {
        if (!cancelled) {
          clearPersistedCoupon();
          couponHydrateAttemptedRef.current = null;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    isGuestCheckoutFlow,
    appliedCoupon,
    couponPricingSnapshot,
    availableItems.length,
    setPersistedCoupon,
    clearPersistedCoupon,
  ]);

  useEffect(() => {
    if (selectedPayment !== "buy-now-pay-later") {
      bnplWidgetHandleRef.current?.close();
      bnplWidgetHandleRef.current = null;
      bnplApplicationIdRef.current = null;
      return;
    }

    const widgetCart = {
      items: itemsForCheckout.map((item) => ({
        name: item.product.name,
        qty: item.quantity,
        // App stores prices in naira; widget expects kobo (naira x100)
        price: Math.round(
          (typeof item.product.price === "number"
            ? item.product.price
            : item.product.price.current) * 100
        ),
        imageUrl: item.product.images?.main ?? undefined,
      })),
      total: Math.round(total * 100),
      currency: "NGN" as const,
    };

    const prefill = buildPartnerPrefill({
      firstName: billingDetails.firstName,
      lastName: billingDetails.lastName,
      phone: billingDetails.phoneNumber,
      email: billingDetails.emailAddress,
    });

    const handle = initBnplWidget({
      publicKey: config.neocash.publicKey,
      assetPrefix: config.neocash.assetPrefix,
      cart: widgetCart,
      ...(prefill && { partnerPrefill: prefill }),
      theme: BNPL_WIDGET_THEME,
      onApprovalPending: (applicationId) => {
        // Place the order after the BNPL application has been submitted.
        bnplApplicationIdRef.current = applicationId;
        handlePlaceOrderRef.current?.();
      },
      onClose: () => {
        bnplWidgetHandleRef.current = null;
        setSelectedPayment("bank-card");
      },
      onError: (err) => {
        console.error("NeoCash BNPL widget error:", err);
        bnplWidgetHandleRef.current = null;
        setSelectedPayment("bank-card");
      },
    });

    bnplWidgetHandleRef.current = handle;

    return () => {
      handle.close();
      bnplWidgetHandleRef.current = null;
    };
    // Only re-run when the payment method changes -- cart snapshot is
    // intentionally captured once when the user opens the widget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPayment]);

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

  const handleRemoveAllNonLagosFromCheckout = () => {
    if (!deliveryValidation?.affectedProductIds.length) return;
    const merged = [
      ...new Set([
        ...checkoutExcludedProductIds,
        ...deliveryValidation.affectedProductIds,
      ]),
    ];
    setCheckoutExcludedProductIds(merged);
    window.setTimeout(() => refreshDeliveryValidation(), 0);
  };

  const handlePlaceOrder = async () => {
    // Check if cart is empty first (only check available items)
    if (availableItems.length === 0) {
      alert("Your cart is empty. Please add items to your cart before placing an order.");
      navigate("/products");
      return;
    }

    if (itemsForCheckout.length === 0) {
      alert(
        "No items left in this checkout. Remove exclusions or add items to continue."
      );
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

    setIsValidatingDelivery(true);
    try {
      const buyerAddress = buildBuyerAddressLine(billingDetails, selectedAddress);
      const cartPayload = expandCartItemsForValidateDelivery(itemsForCheckout);
      if (!buyerAddress.trim() || cartPayload.length === 0) {
        throw new Error(
          "Complete your shipping address and ensure your cart has items to validate delivery."
        );
      }
      const isTransientDeliveryValidationError =
        Boolean(deliveryValidationError) &&
        /timeout|timed out|network|unable to connect/i.test(
          deliveryValidationError ?? ""
        );
      const hasUsableCachedValidation =
        Boolean(deliveryValidation) &&
        (!deliveryValidationError || isTransientDeliveryValidationError) &&
        !isDeliveryValidationLoading;

      // Fast path: if delivery was already validated for current checkout state,
      // reuse it to avoid an extra pre-checkout network round-trip.
      const normalized =
        hasUsableCachedValidation && deliveryValidation
          ? deliveryValidation
          : parseValidateDeliveryResponse(
              await orderApi.validateDelivery({
                buyerAddress,
                cartItems: cartPayload,
              })
            );

      const checkoutPids = itemsForCheckout.map((i) => i.product.id);
      const hasAffectedStillInCheckout = normalized.affectedProductIds.some((id) =>
        itemsForCheckout.some((i) => i.product.id === id)
      );
      const inferredMixed = inferMixedDeliveryCase(
        normalized.affectedProductIds,
        checkoutPids
      );
      const stillMixedBlocked =
        hasAffectedStillInCheckout &&
        (Boolean(normalized.isMixedCart) || inferredMixed);

      if (stillMixedBlocked) {
        setIsValidatingDelivery(false);
        void refreshDeliveryValidation();
        return;
      }
    } catch (e) {
      const msg = apiErrorUtils.getErrorMessage(e);
      setIsValidatingDelivery(false);
      alert(`Delivery validation failed: ${msg}\n\nPlease try again.`);
      return;
    }
    setIsValidatingDelivery(false);

    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const billingData = transformBillingDetails(billingDetails);
      const orderItems = transformCartItemsToOrderItems(itemsForCheckout);
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
        ...(paymentMethod === "bnpl" &&
          bnplApplicationIdRef.current && {
            applicationId: bnplApplicationIdRef.current,
          }),
        ...(isGuestCheckoutFlow && { guestCheckout: 1 }),
        ...(isGuestCheckoutFlow &&
          guestWantsAccount &&
          guestPassword.trim() && {
            createAccount: 1,
            password: guestPassword,
          }),
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
          setIsRedirectingToPayment(true);
          await clearAllItems();
          window.location.href = response.paymentData.authorizationUrl;
          return;
        }

        if (response.redirectUrl) {
          persistGuestRegisterPrefill();
          setIsRedirectingToPayment(true);
          await clearAllItems();
          window.location.href = response.redirectUrl;
          return;
        }

        await clearAllItems();
        bnplApplicationIdRef.current = null;

        setShowSuccess(true);
        return;
      }

      throw new Error(response.message || "Failed to place order");
    } catch (error) {
      console.error("âŒ Checkout failed:", error);

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

  // Keep the ref in sync so the widget callback always calls the latest version.
  handlePlaceOrderRef.current = handlePlaceOrder;

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
                    <li>â€¢ Faster checkout with saved information</li>
                    <li>â€¢ Order tracking and history</li>
                    <li>â€¢ Exclusive member offers</li>
                    <li>â€¢ Easy returns and exchanges</li>
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
            <div>
              <p className="font-medium flex items-center gap-2">
                <User className="w-4 h-4 flex-shrink-0" />
                Checking out as guest
              </p>
              <p className="text-sm text-gray-600 mt-1">
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

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State*
                      </label>
                      <select
                        name="townCity"
                        value={billingDetails.townCity}
                        onChange={(e) =>
                          handleInputChange("townCity", e.target.value)
                        }
                        className={cn(
                          "h-10 w-full rounded-md border border-gray-400 bg-background px-3 py-2 text-sm",
                          getFieldError("townCity") &&
                            "border-red-500 focus:ring-red-500"
                        )}
                        required
                      >
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
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

                    {/* Guest: optional account creation (password â†’ signup / OTP flow) */}
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
            {showMixedCartBanner && (
              <Alert className="mb-4 border-green-200 bg-green-50 text-green-950">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Mixed cart</p>
                    <p className="text-sm text-green-900/90">
                      Some items in your cart are from vendors located outside Lagos.
                      At the moment, automated delivery is only available for orders
                      where both pickup and delivery locations are within Lagos.
                      Delivery for items outside Lagos is currently handled manually,
                      and our support team will contact you to confirm delivery
                      arrangements and pricing. To continue with automated checkout,
                      you can remove items from vendors outside Lagos.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-green-300 bg-white text-green-950 hover:bg-green-100"
                    onClick={handleRemoveAllNonLagosFromCheckout}
                    disabled={
                      isValidatingDelivery || isDeliveryValidationLoading
                    }
                    >
                      Remove All Non-Lagos Items
                    </Button>
                    <p className="text-xs text-green-900/80">
                      Removes non-Lagos lines from this checkout only â€” they stay in your
                      cart.
                    </p>
                  </div>
                </div>
              </Alert>
            )}

            {hasHeavyProductInCheckout && (
              <Alert
                variant="destructive"
                className="mb-4"
              >
                <p>
                  Products weighing above 10KG require manual delivery arrangements, as our current delivery partner cannot handle shipments exceeding this limit.
                </p>
                <ul className="mt-2 space-y-0.5 list-disc list-inside">
                  {heavyCheckoutItems.map((item) => (
                    <li key={item.product.id}>
                      <span className="font-medium">{item.product.name}</span>
                      {' '}â€” {((item.product.shipping.weight ?? 0)).toFixed(2).replace(/\.00$/, '')}KG
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  Kindly remove it from the cart or continue via manual delivery method.
                </p>
              </Alert>
            )}

            <OrderSummary
              items={itemsForCheckout}
              subtotal={merchandiseSubtotal}
              shipping={shipping}
              showShipping={Boolean(deliveryValidation) && showAutomatedDeliveryUi}
              flatRate={flatRate}
              tax={0}
              discount={summaryDiscount}
              total={total}
              appliedCoupon={appliedCoupon}
              showTitle={false}
              highlightProductIds={highlightProductIdsForSummary}
            />

            {shouldShowDeliveryCard && (
              <Card className="mt-6">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-lg font-medium text-gray-900">Delivery</h3>
                  {deliveryValidationError && (
                    <div className="flex items-start gap-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{deliveryValidationError}</span>
                    </div>
                  )}
                  {deliveryValidation && !deliveryValidationError && (() => {
                    const showAutomatedUi = showAutomatedDeliveryUi;

                    if (showAutomatedUi && deliveryValidation.wakaLine &&
                      (deliveryValidation.wakaLine.price !== undefined ||
                        deliveryValidation.wakaLine.eta)) {
                      return (
                        <div className="rounded-lg border border-green-200 bg-green-50/80 p-4 space-y-1">
                          <div className="inline-flex items-center bg-gray-900 rounded px-2 py-1">
                            <img
                              src={wakaLineLogoWhite}
                              alt={deliveryValidation.wakaLine.label ?? "Waka Line"}
                              className="h-6 object-contain"
                            />
                          </div>
                          {deliveryValidation.wakaLine.price !== undefined && (
                            <p className="text-sm text-gray-700">
                              Price: {formatPrice(deliveryValidation.wakaLine.price)}
                            </p>
                          )}
                          {deliveryValidation.wakaLine.eta && (
                            <p className="text-sm text-gray-700">
                              ETA: {deliveryValidation.wakaLine.eta}
                            </p>
                          )}
                        </div>
                      );
                    }

                    if (showAutomatedUi && deliveryValidation.deliveryOptions.length > 0) {
                      return (
                        <ul className="space-y-2">
                          {deliveryValidation.deliveryOptions.map((opt, idx) => (
                            <li
                              key={opt.id ?? `${opt.name ?? "opt"}-${idx}`}
                              className="rounded-lg border border-green-200 bg-green-50/80 p-3 text-sm"
                            >
                              <span className="font-medium text-gray-900">
                                {opt.name ?? opt.provider ?? "Delivery"}
                              </span>
                              {opt.price !== undefined && (
                                <span className="text-gray-700">
                                  {" "}
                                  Â· {formatPrice(opt.price)}
                                </span>
                              )}
                              {(opt.eta ?? opt.estimatedArrival) && (
                                <span className="block text-gray-600 mt-0.5">
                                  ETA: {opt.eta ?? opt.estimatedArrival}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    if (showAutomatedUi) {
                      return (
                        <div className="rounded-lg border border-green-200 bg-green-50/80 p-4">
                          <p className="text-sm font-medium text-gray-900">
                            Automated delivery available
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            Your order qualifies for automated Lagos delivery.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-900">
                          Manual delivery required
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          This item is from a vendor outside Lagos. Automated
                          delivery is currently limited to Lagos (pickup and
                          drop-off). If you proceed, our customer service team
                          will contact you to arrange delivery and confirm the
                          delivery cost separately.
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

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
                      {couponDiscount > 0 && (
                        <span className="text-sm text-green-600">
                          (-{formatPrice(couponDiscount)})
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleRemoveCoupon()}
                      disabled={isCouponRemoving}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isCouponRemoving ? "Removingâ€¦" : "Remove"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          if (couponError) setCouponError(null);
                        }}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleApplyCoupon();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => void handleApplyCoupon()}
                        disabled={!couponCode.trim() || isCouponApplying}
                      >
                        {isCouponApplying ? "Applyingâ€¦" : "Apply"}
                      </Button>
                    </div>

                    {couponError && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {couponError}
                      </div>
                    )}

                    {isGuestCheckoutFlow && (
                      <p className="text-xs text-muted-foreground">
                        Guest checkout: your code is sent with the order. Sign in
                        to validate coupons against your cart first.
                      </p>
                    )}
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
                {selectedPayment !== "buy-now-pay-later" && (
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={
                      isProcessing ||
                      isValidatingDelivery ||
                      isDeliveryValidationLoading
                    }
                    className="w-full mt-8 bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary py-3 text-base font-medium border border-[#2ac12a]"
                  >
                    {isValidatingDelivery || isDeliveryValidationLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Checking delivery...</span>
                      </div>
                    ) : isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                )}
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

