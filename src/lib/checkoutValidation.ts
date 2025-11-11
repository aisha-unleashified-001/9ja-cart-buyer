export interface ValidationError {
  field: string;
  message: string;
}

export interface BillingDetailsForm {
  firstName: string;
  lastName: string;
  companyName: string;
  streetAddress: string;
  apartment: string;
  townCity: string;
  phoneNumber: string;
  emailAddress: string;
}

export const validateBillingDetails = (details: BillingDetailsForm): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required field validations
  if (!details.firstName.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  // lastName is optional since API only uses firstName

  if (!details.streetAddress.trim()) {
    errors.push({ field: 'streetAddress', message: 'Street address is required' });
  }

  if (!details.townCity.trim()) {
    errors.push({ field: 'townCity', message: 'Town/City is required' });
  }

  if (!details.phoneNumber.trim()) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else if (!/^\+?[\d\s\-\(\)]+$/.test(details.phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: 'Please enter a valid phone number' });
  }

  if (!details.emailAddress.trim()) {
    errors.push({ field: 'emailAddress', message: 'Email address is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.emailAddress)) {
    errors.push({ field: 'emailAddress', message: 'Please enter a valid email address' });
  }

  return errors;
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
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