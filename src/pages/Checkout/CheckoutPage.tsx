import React, { useState, useEffect, useRef, useMemo } from "react";
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
  X,
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

interface BnplAddress {
  street: string;
  town: string;
  state: string;
}

interface BnplWorkInformation {
  company: string;
  job_role: string;
  monthly_salary: number;
  start_date: string;
  office_address: BnplAddress;
}

interface BnplProfileForm {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  partner_ref: string;
  bvn: string;
  nin: string;
  date_of_birth: string;
  gender: number;
  state_of_origin: string;
  home_address: BnplAddress;
  work_information: BnplWorkInformation;
}

type BnplStatus = "approved" | "pending" | "rejected";
type BnplStep = "info" | "form" | "otp" | "processing" | "decision";
type BnplFormStep = "identity" | "details";

const CHECKOUT_GUEST_PARAM = "guest";
const BNPL_INPUT_STROKE_CLASS = "w-full !border-gray-400";
const BNPL_OTP_LENGTH = 6;
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
  const [showBnplModal, setShowBnplModal] = useState(false);
  const [bnplStep, setBnplStep] = useState<BnplStep>("info");
  const [bnplFormStep, setBnplFormStep] = useState<BnplFormStep>("identity");
  const [bnplStatus, setBnplStatus] = useState<BnplStatus | null>(null);
  const [bnplValidationError, setBnplValidationError] = useState<string | null>(
    null
  );
  const [bnplOtp, setBnplOtp] = useState("");
  const [bnplOtpError, setBnplOtpError] = useState<string | null>(null);
  const [bnplOtpTarget] = useState("123456"); // Frontend demo OTP; no API interaction.
  const bnplOtpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [bnplProfile, setBnplProfile] = useState<BnplProfileForm>({
    first_name: "Adebayo",
    last_name: "Ogunlesi",
    phone: "+2348012345678",
    email: "adebayo@example.com",
    partner_ref: "REF-001",
    bvn: "22345678901",
    nin: "12345678901",
    date_of_birth: "1990-05-15",
    gender: 1,
    state_of_origin: "Lagos",
    home_address: {
      street: "45 Ozumba Mbadiwe Rd",
      town: "Lekki",
      state: "Lagos",
    },
    work_information: {
      company: "Unilever Nigeria Ltd.",
      job_role: "Head of Finance",
      monthly_salary: 540000000,
      start_date: "31-09-1977",
      office_address: {
        street: "45 Ozumba Mbadiwe Rd",
        town: "Lekki",
        state: "Lagos",
      },
    },
  });
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

  // Use filtered values from cart (already exclude unavailable products)
  const discount = couponDiscount;

  const checkoutExcludedSet = useMemo(
    () => new Set(checkoutExcludedProductIds),
    [checkoutExcludedProductIds]
  );

  const itemsForCheckout = useMemo(
    () =>
      availableItems.filter((i) => !checkoutExcludedSet.has(i.product.id)),
    [availableItems, checkoutExcludedSet]
  );

  const cartSubtotal = useMemo(() => {
    return itemsForCheckout.reduce((acc, item) => {
      const price =
        typeof item.product.price === "number"
          ? item.product.price
          : item.product.price.current;
      return acc + price * item.quantity;
    }, 0);
  }, [itemsForCheckout]);

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

  const total = cartSubtotal + shipping + flatRate - discount;

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

  useEffect(() => {
    if (selectedPayment !== "buy-now-pay-later") {
      setShowBnplModal(false);
      return;
    }
    setShowBnplModal(true);
    setBnplStep("info");
    setBnplStatus(null);
    setBnplValidationError(null);
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

  const handleBnplProfileChange = (
    field: keyof Omit<
      BnplProfileForm,
      "home_address" | "work_information" | "gender"
    >,
    value: string
  ) => {
    setBnplProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    setBnplValidationError(null);
  };

  const handleBnplHomeAddressChange = (field: keyof BnplAddress, value: string) => {
    setBnplProfile((prev) => ({
      ...prev,
      home_address: {
        ...prev.home_address,
        [field]: value,
      },
    }));
    setBnplValidationError(null);
  };

  const handleBnplWorkInfoChange = (
    field: keyof Omit<BnplWorkInformation, "office_address" | "monthly_salary">,
    value: string
  ) => {
    setBnplProfile((prev) => ({
      ...prev,
      work_information: {
        ...prev.work_information,
        [field]: value,
      },
    }));
    setBnplValidationError(null);
  };

  const handleBnplOfficeAddressChange = (
    field: keyof BnplAddress,
    value: string
  ) => {
    setBnplProfile((prev) => ({
      ...prev,
      work_information: {
        ...prev.work_information,
        office_address: {
          ...prev.work_information.office_address,
          [field]: value,
        },
      },
    }));
    setBnplValidationError(null);
  };

  const handleBnplApplicationSubmit = async () => {
    const requiredFields = [
      bnplProfile.first_name,
      bnplProfile.last_name,
      bnplProfile.phone,
      bnplProfile.email,
      bnplProfile.partner_ref,
      bnplProfile.bvn,
      bnplProfile.nin,
      bnplProfile.date_of_birth,
      bnplProfile.state_of_origin,
      bnplProfile.home_address.street,
      bnplProfile.home_address.town,
      bnplProfile.home_address.state,
      bnplProfile.work_information.company,
      bnplProfile.work_information.job_role,
      bnplProfile.work_information.start_date,
      bnplProfile.work_information.office_address.street,
      bnplProfile.work_information.office_address.town,
      bnplProfile.work_information.office_address.state,
    ];

    const hasEmptyField = requiredFields.some((value) => !value.trim());
    if (
      hasEmptyField ||
      bnplProfile.gender < 1 ||
      bnplProfile.work_information.monthly_salary <= 0
    ) {
      setBnplValidationError("Please complete all BNPL profile fields.");
      return;
    }

    if (!/^\d{11}$/.test(bnplProfile.bvn)) {
      setBnplValidationError("BVN must be 11 digits.");
      return;
    }

    if (!/^\d{11}$/.test(bnplProfile.nin)) {
      setBnplValidationError("NIN must be 11 digits.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(bnplProfile.email)) {
      setBnplValidationError("Please enter a valid email address.");
      return;
    }

    setBnplValidationError(null);
    setBnplOtp("");
    setBnplOtpError(null);
    setBnplStatus(null);
    setBnplStep("otp");
  };

  const handleBnplOtpVerify = async () => {
    const otp = bnplOtp.replace(/\D/g, "").slice(0, BNPL_OTP_LENGTH);
    if (otp.length !== BNPL_OTP_LENGTH) {
      setBnplOtpError("Enter the 6-digit OTP sent to your phone.");
      return;
    }

    if (otp !== bnplOtpTarget) {
      setBnplOtpError("Invalid OTP. Please try again.");
      return;
    }

    setBnplOtpError(null);
    setBnplStep("processing");

    await new Promise((resolve) => setTimeout(resolve, 1500));
    setBnplStatus("pending");
    setBnplStep("decision");
  };

  const handleBnplOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const otpChars = bnplOtp.padEnd(BNPL_OTP_LENGTH, " ").split("");
    otpChars[index] = digit || " ";
    const nextOtp = otpChars.join("").replace(/\s/g, "");
    setBnplOtp(nextOtp);
    setBnplOtpError(null);

    if (digit && index < BNPL_OTP_LENGTH - 1) {
      bnplOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleBnplOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Backspace") return;

    const otpChars = bnplOtp.padEnd(BNPL_OTP_LENGTH, " ").split("");
    if (otpChars[index]?.trim()) return;

    if (index > 0) {
      bnplOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleBnplOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, BNPL_OTP_LENGTH);

    if (!pastedDigits) return;

    setBnplOtp(pastedDigits);
    setBnplOtpError(null);
    const focusIndex = Math.min(pastedDigits.length, BNPL_OTP_LENGTH - 1);
    bnplOtpInputRefs.current[focusIndex]?.focus();
  };

  const handleCloseBnplModal = () => {
    setShowBnplModal(false);
    setSelectedPayment("bank-card");
    setBnplStep("info");
    setBnplFormStep("identity");
    setBnplStatus(null);
    setBnplValidationError(null);
    setBnplOtp("");
    setBnplOtpError(null);
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
      const hasUsableCachedValidation =
        Boolean(deliveryValidation) &&
        !deliveryValidationError &&
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
                      Removes non-Lagos lines from this checkout only — they stay in your
                      cart.
                    </p>
                  </div>
                </div>
              </Alert>
            )}

            <OrderSummary
              items={itemsForCheckout}
              subtotal={cartSubtotal}
              shipping={shipping}
              flatRate={flatRate}
              tax={0}
              discount={discount}
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
                          <p className="text-sm font-semibold text-gray-900">
                            {deliveryValidation.wakaLine.label ?? "Waka Line"}
                          </p>
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
                                  · {formatPrice(opt.price)}
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

        {showBnplModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Buy Now, Pay Later
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseBnplModal}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  aria-label="Close BNPL modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-5">
                {bnplStep === "info" && (
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-gray-900">
                      Split your payment into flexible installments
                    </h4>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>
                        Choose BNPL to spread payments with clear terms before
                        completing your order.
                      </p>
                      <p>
                        <span className="font-medium">Duration:</span> Up to 3
                        monthly installments
                      </p>
                      <p>
                        <span className="font-medium">Interest:</span> 0% for
                        eligible users
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="w-full bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary border border-[#2ac12a]"
                      onClick={() => {
                        setBnplFormStep("identity");
                        setBnplStep("form");
                      }}
                    >
                      Continue with BNPL
                    </Button>
                  </div>
                )}

                {bnplStep === "form" && (
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-gray-900">
                      BNPL Application Form
                    </h4>
                    {bnplFormStep === "identity" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            First Name
                          </label>
                          <Input
                            value={bnplProfile.first_name}
                            onChange={(e) =>
                              handleBnplProfileChange(
                                "first_name",
                                e.target.value
                              )
                            }
                            placeholder="First name"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Last Name
                          </label>
                          <Input
                            value={bnplProfile.last_name}
                            onChange={(e) =>
                              handleBnplProfileChange(
                                "last_name",
                                e.target.value
                              )
                            }
                            placeholder="Last name"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <Input
                            value={bnplProfile.phone}
                            onChange={(e) =>
                              handleBnplProfileChange("phone", e.target.value)
                            }
                            placeholder="+2348012345678"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={bnplProfile.email}
                            onChange={(e) =>
                              handleBnplProfileChange("email", e.target.value)
                            }
                            placeholder="email@example.com"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Partner Reference
                          </label>
                          <Input
                            value={bnplProfile.partner_ref}
                            onChange={(e) =>
                              handleBnplProfileChange(
                                "partner_ref",
                                e.target.value
                              )
                            }
                            placeholder="Partner reference"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            BVN
                          </label>
                          <Input
                            value={bnplProfile.bvn}
                            onChange={(e) =>
                              handleBnplProfileChange("bvn", e.target.value)
                            }
                            placeholder="22345678901"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            NIN
                          </label>
                          <Input
                            value={bnplProfile.nin}
                            onChange={(e) =>
                              handleBnplProfileChange("nin", e.target.value)
                            }
                            placeholder="12345678901"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Date of Birth
                          </label>
                          <Input
                            type="date"
                            value={bnplProfile.date_of_birth}
                            onChange={(e) =>
                              handleBnplProfileChange(
                                "date_of_birth",
                                e.target.value
                              )
                            }
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Gender
                          </label>
                          <select
                            value={bnplProfile.gender}
                            onChange={(e) =>
                              setBnplProfile((prev) => ({
                                ...prev,
                                gender: Number(e.target.value),
                              }))
                            }
                            className="h-10 w-full rounded-md border border-gray-400 bg-background px-3 py-2 text-sm"
                          >
                            <option value={1}>Male</option>
                            <option value={2}>Female</option>
                            <option value={3}>Other</option>
                          </select>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-sm font-medium text-gray-700">
                            State of Origin
                          </label>
                          <Input
                            value={bnplProfile.state_of_origin}
                            onChange={(e) =>
                              handleBnplProfileChange(
                                "state_of_origin",
                                e.target.value
                              )
                            }
                            placeholder="Lagos"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                      </div>
                    )}

                    {bnplFormStep === "identity" && (
                      <Button
                        type="button"
                        className="w-full bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary border border-[#2ac12a]"
                        onClick={() => {
                          setBnplValidationError(null);
                          setBnplFormStep("details");
                        }}
                      >
                        Next
                      </Button>
                    )}

                    {bnplFormStep === "details" && (
                      <>
                        <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                      <h5 className="text-sm font-semibold text-gray-900">
                        Home Address
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-sm font-medium text-gray-700">
                            Street
                          </label>
                          <Input
                            value={bnplProfile.home_address.street}
                            onChange={(e) =>
                              handleBnplHomeAddressChange("street", e.target.value)
                            }
                            placeholder="45 Ozumba Mbadiwe Rd"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Town
                          </label>
                          <Input
                            value={bnplProfile.home_address.town}
                            onChange={(e) =>
                              handleBnplHomeAddressChange("town", e.target.value)
                            }
                            placeholder="Lekki"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            State
                          </label>
                          <Input
                            value={bnplProfile.home_address.state}
                            onChange={(e) =>
                              handleBnplHomeAddressChange("state", e.target.value)
                            }
                            placeholder="Lagos"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                      <h5 className="text-sm font-semibold text-gray-900">
                        Work Information
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Company
                          </label>
                          <Input
                            value={bnplProfile.work_information.company}
                            onChange={(e) =>
                              handleBnplWorkInfoChange("company", e.target.value)
                            }
                            placeholder="Unilever Nigeria Ltd."
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Job Role
                          </label>
                          <Input
                            value={bnplProfile.work_information.job_role}
                            onChange={(e) =>
                              handleBnplWorkInfoChange("job_role", e.target.value)
                            }
                            placeholder="Head of Finance"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Monthly Salary
                          </label>
                          <Input
                            type="number"
                            value={bnplProfile.work_information.monthly_salary}
                            onChange={(e) =>
                              setBnplProfile((prev) => ({
                                ...prev,
                                work_information: {
                                  ...prev.work_information,
                                  monthly_salary: Number(e.target.value || 0),
                                },
                              }))
                            }
                            placeholder="540000000"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Start Date
                          </label>
                          <Input
                            value={bnplProfile.work_information.start_date}
                            onChange={(e) =>
                              handleBnplWorkInfoChange("start_date", e.target.value)
                            }
                            placeholder="31-09-1977"
                            className={BNPL_INPUT_STROKE_CLASS}
                          />
                        </div>
                      </div>

                      <div className="rounded-md border border-gray-200 p-3 space-y-3">
                        <h6 className="text-sm font-semibold text-gray-900">
                          Office Address
                        </h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-sm font-medium text-gray-700">
                              Street
                            </label>
                            <Input
                              value={bnplProfile.work_information.office_address.street}
                              onChange={(e) =>
                                handleBnplOfficeAddressChange("street", e.target.value)
                              }
                              placeholder="45 Ozumba Mbadiwe Rd"
                              className={BNPL_INPUT_STROKE_CLASS}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">
                              Town
                            </label>
                            <Input
                              value={bnplProfile.work_information.office_address.town}
                              onChange={(e) =>
                                handleBnplOfficeAddressChange("town", e.target.value)
                              }
                              placeholder="Lekki"
                              className={BNPL_INPUT_STROKE_CLASS}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">
                              State
                            </label>
                            <Input
                              value={bnplProfile.work_information.office_address.state}
                              onChange={(e) =>
                                handleBnplOfficeAddressChange("state", e.target.value)
                              }
                              placeholder="Lagos"
                              className={BNPL_INPUT_STROKE_CLASS}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {bnplValidationError && (
                      <p className="text-sm text-red-600">{bnplValidationError}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-1/2"
                        onClick={() => {
                          setBnplValidationError(null);
                          setBnplFormStep("identity");
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="w-1/2 bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary border border-[#2ac12a]"
                        onClick={handleBnplApplicationSubmit}
                      >
                        Submit Application
                      </Button>
                    </div>
                      </>
                    )}
                  </div>
                )}

                {bnplStep === "otp" && (
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-gray-900">
                      Enter OTP
                    </h4>

                    <p className="text-sm text-gray-700">
                      We've sent a 6-digit OTP to{" "}
                      <span className="font-medium text-gray-900">
                        {bnplProfile.phone}
                      </span>
                      .
                    </p>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        OTP
                      </label>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: BNPL_OTP_LENGTH }, (_, index) => (
                          <Input
                            key={`bnpl-otp-${index}`}
                            ref={(el) => {
                              bnplOtpInputRefs.current[index] = el;
                            }}
                            value={bnplOtp[index] || ""}
                            onChange={(e) =>
                              handleBnplOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleBnplOtpKeyDown(index, e)}
                            onPaste={handleBnplOtpPaste}
                            inputMode="numeric"
                            maxLength={1}
                            className="h-11 w-11 text-center text-lg font-semibold border-gray-400"
                          />
                        ))}
                      </div>
                    </div>

                    {bnplOtpError && (
                      <p className="text-sm text-red-600">{bnplOtpError}</p>
                    )}

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-1/2"
                        onClick={() => {
                          setBnplOtp("");
                          setBnplOtpError(null);
                          setBnplFormStep("details");
                          setBnplStep("form");
                        }}
                      >
                        Back
                      </Button>

                      <Button
                        type="button"
                        className="w-1/2 bg-[#8DEB6E] hover:bg-[#8DEB6E]/90 text-primary border border-[#2ac12a]"
                        onClick={handleBnplOtpVerify}
                      >
                        Verify OTP
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Demo OTP: <span className="font-medium">123456</span>
                    </p>
                  </div>
                )}

                {bnplStep === "processing" && (
                  <div className="py-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#182F38] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-700">
                        We are reviewing your application...
                      </p>
                    </div>
                  </div>
                )}

                {bnplStep === "decision" && bnplStatus && (
                  <div className="space-y-2">
                    <h4 className="text-base font-semibold text-gray-900 capitalize">
                      Application submitted successfully
                    </h4>
                    {bnplStatus === "pending" && (
                      <p className="text-sm text-amber-700 font-medium">
                        Your BNPL application is currently being reviewed.
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Our team is reviewing your details.
                    </p>
                    {bnplStatus === "rejected" && (
                      <>
                        <p className="text-sm text-red-700">
                          Application was rejected. Please use Bank/Card to
                          complete this order.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={handleCloseBnplModal}
                        >
                          Switch to Bank/Card
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
