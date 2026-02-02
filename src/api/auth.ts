import { apiClient } from './client';

// Auth API request types
export interface LoginRequest {
  emailAddress: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
}

export interface OtpVerificationRequest {
  otp: string;
  identifier: string;
  verificationId: string;
}

export interface ResendOtpRequest {
  identifier: string;
  type: 'BUYER_EMAIL_OTP';
}

export interface GoogleLoginRequest {
  idToken: string; // ID Token (JWT) from Google
  accessToken: string; // Access Token (same as idToken for Google OAuth)
}

export interface ForgotPasswordRequest {
  emailAddress: string;
}

export interface ForgotPasswordResponse {
  status: number;
  error: boolean;
  message: string;
  data?: {
    identifier: string;
    verificationId?: string;
    messageId?: string | null;
  };
}

export interface ResetPasswordRequest {
  otp: string;
  identifier: string;
  verificationId: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Auth API response types
export interface LoginSuccessResponse {
  status: number;
  error: boolean;
  message: string;
  data: {
    buyerId: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string | null;
    token: string;
  };
}

export interface RegisterSuccessResponse {
  status: number;
  error: boolean;
  message: string;
  data?: {
    verificationId: string;
    identifier: string;
  };
}

export interface OtpVerificationResponse {
  status: number;
  error: boolean;
  message: string;
  data?: {
    buyerId: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string | null;
    token: string;
  };
}

export interface ResendOtpResponse {
  status: number;
  error: boolean;
  message: string;
}

export interface AuthErrorResponse {
  status: number;
  error: number;
  messages: {
    error?: string;
    emailAddress?: string;
    firstName?: string;
    lastName?: string;
  };
}

// Auth API endpoints
export const authApi = {
  // Login endpoint
  login: async (credentials: LoginRequest): Promise<LoginSuccessResponse> => {
    return apiClient.post<LoginSuccessResponse>('/buyer/login', credentials);
  },

  // Register endpoint
  register: async (userData: RegisterRequest): Promise<RegisterSuccessResponse> => {
    return apiClient.post<RegisterSuccessResponse>('/buyer/signup', userData);
  },

  // OTP verification endpoint
  verifyOtp: async (otpData: OtpVerificationRequest): Promise<OtpVerificationResponse> => {
    return apiClient.post<OtpVerificationResponse>('/buyer/otp-verification', otpData);
  },

  // Resend OTP endpoint
  resendOtp: async (resendData: ResendOtpRequest): Promise<ResendOtpResponse> => {
    return apiClient.post<ResendOtpResponse>('/buyer/resend-otp', resendData);
  },

  // Google login endpoint
  googleLogin: async (googleData: GoogleLoginRequest): Promise<LoginSuccessResponse> => {
    return apiClient.post<LoginSuccessResponse>('/buyer/google-login', googleData);
  },

  // Forgot password (buyer; sends OTP to email; returns identifier and verificationId for reset step)
  forgotPassword: async (payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    return apiClient.post<ForgotPasswordResponse>('/buyer/forgot-password', payload, undefined, false);
  },

  // Reset password (buyer; requires OTP from forgot-password step; no response body on success)
  resetPassword: async (payload: ResetPasswordRequest): Promise<void> => {
    return apiClient.postWithBodyNoResponse('/buyer/reset-password', payload, false);
  },

  // Logout (if needed for server-side logout)
  logout: async (): Promise<void> => {
    // For now, just a placeholder - implement if backend has logout endpoint
    return Promise.resolve();
  },
};