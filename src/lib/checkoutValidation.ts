export interface ValidationError {
  field: string;
  message: string;
}

export interface BillingDetailsForm {
  firstName: string;
  lastName: string;
  streetAddress: string;
  apartment: string;
  townCity: string;
  phoneNumber: string;
  emailAddress: string;
}

export interface ValidateBillingOptions {
  /** When true, empty phone is allowed (guest checkout). */
  phoneOptional?: boolean;
}

export const validateBillingDetails = (
  details: BillingDetailsForm,
  options?: ValidateBillingOptions
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const phoneOptional = options?.phoneOptional === true;

  // Required field validations
  if (!details.firstName.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  // lastName is optional since API only uses firstName

  if (!details.streetAddress.trim()) {
    errors.push({ field: 'streetAddress', message: 'Street address is required' });
  }

  if (!details.townCity.trim()) {
    errors.push({ field: 'townCity', message: 'State is required' });
  }

  const phoneTrim = details.phoneNumber.trim();
  if (!phoneOptional) {
    if (!phoneTrim) {
      errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(details.phoneNumber)) {
      errors.push({ field: 'phoneNumber', message: 'Please enter a valid phone number' });
    }
  } else if (phoneTrim && !/^\+?[\d\s\-\(\)]+$/.test(details.phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: 'Please enter a valid phone number' });
  }

  if (!details.emailAddress.trim()) {
    errors.push({ field: 'emailAddress', message: 'Email address is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.emailAddress)) {
    errors.push({ field: 'emailAddress', message: 'Please enter a valid email address' });
  }

  return errors;
};

const ALLOWED_SPECIAL = "!@$%&*?";

/** Returns an error message if invalid; null if password meets RegisterPage rules. */
export const validateCheckoutAccountPassword = (password: string): string | null => {
  if (password.length < 6) {
    return "Password must be at least 6 characters long";
  }
  const requirements = [
    { regex: /[A-Z]/, message: "an uppercase letter" },
    { regex: /[a-z]/, message: "a lowercase letter" },
    { regex: /[0-9]/, message: "a number" },
    {
      regex: new RegExp(
        `[${ALLOWED_SPECIAL.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}]`
      ),
      message: `a special character (${ALLOWED_SPECIAL.split("").join(" ")})`,
    },
  ];
  const missing = requirements.filter((r) => !r.regex.test(password)).map((r) => r.message);
  if (missing.length === 0) return null;
  if (missing.length === 1) return `Password must include ${missing[0]}.`;
  return `Password must include ${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}.`;
};

export const formatPhoneNumber = (phone: string): string => {
  const trimmed = phone.trim();
  // Preserve international / Nigerian-style entry; only format obvious 10-digit local US-style input
  if (trimmed.startsWith("+") || trimmed.length > 10) {
    return phone;
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

export const formatCreditCard = (cardNumber: string): string => {
  // Remove all non-digit characters
  const digits = cardNumber.replace(/\D/g, '');
  
  // Add spaces every 4 digits
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};