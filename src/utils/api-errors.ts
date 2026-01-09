import { ApiError } from '../api/client';

// API error handling utilities
export const apiErrorUtils = {
  // Extract user-friendly error message from API error
  getErrorMessage: (error: unknown): string => {
    if (error instanceof ApiError) {
      // Handle specific API error responses
      if (error.data && typeof error.data === 'object') {
        const data = error.data as Record<string, unknown>;
        
        // Check for direct message field in error data
        if (data.message && typeof data.message === 'string') {
          const message = data.message.toLowerCase();
          // Check if it's a streetAddress unique constraint error
          if ((message.includes('streetaddress') || message.includes('street address')) && 
              (message.includes('unique') || message.includes('must contain a unique value'))) {
            return 'This Street Address already exists.';
          }
          return data.message;
        }
        
        // Handle messages object with field-specific errors
        if ('messages' in data && data.messages && typeof data.messages === 'object') {
          const messages = data.messages as Record<string, string>;
          
          // Handle field-specific errors
          if (messages.emailAddress) {
            return messages.emailAddress;
          }
          if (messages.firstName) {
            return messages.firstName;
          }
          if (messages.lastName) {
            return messages.lastName;
          }
          if (messages.currentPassword) {
            return messages.currentPassword;
          }
          if (messages.streetAddress) {
            // Check if it's a unique constraint error
            const streetAddressMessage = messages.streetAddress.toLowerCase();
            if (streetAddressMessage.includes('unique') || streetAddressMessage.includes('must contain a unique value')) {
              return 'This Street Address already exists.';
            }
            return messages.streetAddress;
          }
          if (messages.error) {
            return messages.error;
          }
          
          // Return first available message if none of the specific fields match
          const firstMessage = Object.values(messages)[0];
          if (firstMessage && typeof firstMessage === 'string') {
            return firstMessage;
          }
        }
      }
      
      // Handle general API errors (from ApiError.message)
      if (error.message) {
        const message = error.message.toLowerCase();
        // Check if it's a streetAddress unique constraint error
        if ((message.includes('streetaddress') || message.includes('street address')) && 
            (message.includes('unique') || message.includes('must contain a unique value'))) {
          return 'This Street Address already exists.';
        }
        return error.message;
      }
      
      // Handle HTTP status codes
      switch (error.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Invalid credentials. Please try again.';
        case 403:
          return 'Access denied.';
        case 404:
          return 'Resource not found.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return 'An unexpected error occurred.';
      }
    }
    
    // Handle network errors
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return 'Network error. Please check your connection.';
      }
      return error.message;
    }
    
    return 'An unexpected error occurred.';
  },

  // Check if error is a validation error (400 with field messages)
  isValidationError: (error: unknown): error is ApiError => {
    return error instanceof ApiError && 
           error.status === 400 && 
           error.data !== null &&
           error.data !== undefined &&
           typeof error.data === 'object' && 
           'messages' in error.data;
  },

  // Get field-specific validation errors
  getValidationErrors: (error: unknown): Record<string, string> => {
    if (!apiErrorUtils.isValidationError(error)) {
      return {};
    }
    
    const apiError = error as ApiError;
    const messages = ((apiError.data as Record<string, unknown>)?.messages as Record<string, string>) || {};
    
    // Map API field names to form field names
    const fieldMap: Record<string, string> = {
      emailAddress: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      currentPassword: 'currentPassword',
    };
    
    const validationErrors: Record<string, string> = {};
    
    Object.entries(messages).forEach(([field, message]) => {
      const formField = fieldMap[field] || field;
      validationErrors[formField] = message as string;
    });
    
    return validationErrors;
  },

  // Check if error is authentication related
  isAuthError: (error: unknown): boolean => {
    return error instanceof ApiError && 
           (error.status === 401 || error.status === 403);
  },

  // Check if error is network related
  isNetworkError: (error: unknown): boolean => {
    return error instanceof ApiError && error.status === 0;
  },
};