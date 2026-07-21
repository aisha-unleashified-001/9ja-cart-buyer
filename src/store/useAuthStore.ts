import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../types";
import { authApi, type LoginRequest, type RegisterRequest, type OtpVerificationRequest, type ResendOtpRequest, type GoogleLoginRequest } from "../api/auth";
import { apiErrorUtils } from "../utils/api-errors";
import { createAuthStorage, setRememberMe } from "../lib/authStorage";
import { resetBnplWelcomePopup, markBnplWelcomePending } from "../lib/bnplWelcomePopup";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Verification state
  pendingVerification: {
    identifier: string;
    verificationId: string;
  } | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  googleLogin: (idToken: string, rememberMe?: boolean) => Promise<void>;
  register: (
    userData: Omit<User, "id" | "token"> & { password: string }
  ) => Promise<{ verificationId: string; identifier: string }>;
  verifyEmail: (otp: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  checkAuthStatus: () => void;
  clearPendingVerification: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      pendingVerification: null,

      login: async (email, password, rememberMe = true) => {
        set({ isLoading: true });
        setRememberMe(rememberMe);

        try {
          const loginData: LoginRequest = {
            emailAddress: email,
            password,
          };

          const response = await authApi.login(loginData);

          // Map API response to User interface
          const user: User = {
            id: response.data.buyerId,
            email: response.data.emailAddress,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            phone: response.data.phoneNumber || undefined,
            token: response.data.token,
          };

          set({
            user,
            token: response.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          markBnplWelcomePending();
        } catch (error) {
          set({ isLoading: false });
          // Re-throw with user-friendly message
          const errorMessage = apiErrorUtils.getErrorMessage(error);
          throw new Error(errorMessage);
        }
      },

      googleLogin: async (idToken, rememberMe = true) => {
        set({ isLoading: true });
        setRememberMe(rememberMe);

        try {
          const googleData: GoogleLoginRequest = {
            idToken, // ID Token (JWT) from Google
            accessToken: idToken, // Access Token (same as idToken - backend requires both fields)
          };

          const response = await authApi.googleLogin(googleData);

          // Map API response to User interface
          const user: User = {
            id: response.data.buyerId,
            email: response.data.emailAddress,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            phone: response.data.phoneNumber || undefined,
            token: response.data.token,
            isEmailVerified: true, // Google accounts are pre-verified
          };

          set({
            user,
            token: response.data.token,
            isAuthenticated: true,
            isLoading: false,
            pendingVerification: null, // Clear any pending verification
          });
          markBnplWelcomePending();
        } catch (error) {
          set({ isLoading: false });
          // Re-throw with user-friendly message
          const errorMessage = apiErrorUtils.getErrorMessage(error);
          throw new Error(errorMessage);
        }
      },

      register: async (userData) => {
        set({ isLoading: true });

        try {
          const registerData: RegisterRequest = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            emailAddress: userData.email,
            password: userData.password,
          };

          const response = await authApi.register(registerData);

          // Store verification data for OTP verification
          const verificationData = {
            identifier: userData.email,
            verificationId: response.data?.verificationId || '',
          };

          set({ 
            isLoading: false,
            pendingVerification: verificationData,
          });

          return verificationData;
        } catch (error) {
          set({ isLoading: false });
          // Re-throw with user-friendly message
          const errorMessage = apiErrorUtils.getErrorMessage(error);
          throw new Error(errorMessage);
        }
      },

      verifyEmail: async (otp) => {
        const { pendingVerification } = get();
        
        if (!pendingVerification) {
          throw new Error('No pending verification found');
        }

        set({ isLoading: true });

        try {
          const otpData: OtpVerificationRequest = {
            otp,
            identifier: pendingVerification.identifier,
            verificationId: pendingVerification.verificationId,
          };

          const response = await authApi.verifyOtp(otpData);

          if (response.data) {
            // Map API response to User interface
            const user: User = {
              id: response.data.buyerId,
              email: response.data.emailAddress,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              phone: response.data.phoneNumber || undefined,
              token: response.data.token,
              isEmailVerified: true,
            };

            set({
              user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
              pendingVerification: null,
            });
            markBnplWelcomePending();
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          // Re-throw with user-friendly message
          const errorMessage = apiErrorUtils.getErrorMessage(error);
          throw new Error(errorMessage);
        }
      },

      resendOtp: async () => {
        const { pendingVerification } = get();
        
        if (!pendingVerification) {
          throw new Error('No pending verification found');
        }

        set({ isLoading: true });

        try {
          const resendData: ResendOtpRequest = {
            identifier: pendingVerification.identifier,
            type: 'BUYER_EMAIL_OTP',
          };

          await authApi.resendOtp(resendData);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          // Re-throw with user-friendly message
          const errorMessage = apiErrorUtils.getErrorMessage(error);
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        // Clear auth state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          pendingVerification: null,
        });
        resetBnplWelcomePopup();

        // Optional: Call logout API if needed
        authApi.logout().catch(() => {
          // Ignore logout API errors
        });
      },

      clearPendingVerification: () => {
        set({ pendingVerification: null });
      },

      updateProfile: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      checkAuthStatus: () => {
        const { token } = get();
        if (token) {
          // Basic token validation - you might want to add more sophisticated checks
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const currentTime = Math.floor(Date.now() / 1000);

              if (payload.exp <= currentTime) {
                // Token expired, logout
                get().logout();
              }
            }
          } catch {
            // Invalid token, logout
            get().logout();
          }
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => createAuthStorage()),
      // Only persist user data and token
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        pendingVerification: state.pendingVerification,
      }),
    }
  )
);
