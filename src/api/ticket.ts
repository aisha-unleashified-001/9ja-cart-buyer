/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

// Ticket API request types
export interface ContactAdminRequest {
  subject: string;
  message: string;
}

// Ticket API response types
export interface ContactAdminResponse {
  message?: string;
  data?: any;
  [key: string]: any;
}

// Ticket API functions
export const ticketApi = {
  /**
   * Contact admin endpoint
   * POST /ticket/contact-admin
   * Requires Bearer token authentication
   */
  contactAdmin: async (data: ContactAdminRequest): Promise<ContactAdminResponse> => {
    return apiClient.post<ContactAdminResponse>(
      '/ticket/contact-admin',
      data,
      undefined,
      true // useBearer = true
    );
  },
};

