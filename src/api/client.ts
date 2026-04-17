// HTTP client with interceptors for API communication
import { config } from '../lib/config';
import { getAuthFromStorage } from '../lib/authStorage';

const API_BASE_URL = config.api.baseUrl;

export class ApiError extends Error {
  public status: number;
  public data?: unknown;
  
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

// Generic API client with interceptors
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    try {
      const authStorage = getAuthFromStorage();
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.token || null;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return null;
  }

  private getBasicAuthHeader(): string {
    // Basic Auth credentials for API access
    const { username, password } = config.api.basicAuth;
    // console.log('🔐 Basic Auth credentials:', { username, password: '***' });
    const credentials = btoa(`${username}:${password}`);
    const authHeader = `Basic ${credentials}`;
    // console.log('🔐 Generated Basic Auth header:', authHeader);
    return authHeader;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useBearer: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    config.signal = controller.signal;

    // Determine which authentication to use
    if (useBearer) {
      // Use Bearer token for protected endpoints
      const token = this.getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      } else {
        throw new ApiError(401, 'Authentication token required');
      }
    } else {
      // Use Basic Auth for public endpoints
      config.headers = {
        ...config.headers,
        'Authorization': this.getBasicAuthHeader(),
      };
    }

    try {
      // console.log('API Request:', { 
      //   url, 
      //   method: config.method, 
      //   headers: config.headers,
      //   body: config.body 
      // });
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId); // Clear timeout on response
      
      // console.log('API Response:', { 
      //   status: response.status, 
      //   statusText: response.statusText,
      //   headers: Object.fromEntries(response.headers.entries())
      // });
      
      // Parse response defensively: some backend errors return empty/non-JSON bodies.
      const rawText = await response.text();
      let data: any = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }
      }
      
      if (!response.ok) {
        console.error('API Error Response:', data);
        const messages =
          data && typeof data === 'object' && 'messages' in data
            ? (data.messages as Record<string, unknown>)
            : undefined;
        const firstFieldMessage =
          messages && typeof messages === 'object'
            ? Object.values(messages).find((v) => typeof v === 'string')
            : undefined;
        // Handle API error responses
        throw new ApiError(
          response.status, 
          (data && typeof data === 'object' ? data.messages?.error : undefined) ||
            (typeof firstFieldMessage === 'string' ? firstFieldMessage : undefined) ||
            (data && typeof data === 'object' ? data.message : undefined) ||
            response.statusText ||
            `HTTP error! status: ${response.status}`,
          data
        );
      }
      
      // console.log('API Success Response:', data);
      return data;
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on error
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('❌ API Request timeout (30s)');
          throw new ApiError(408, 'Request timeout - API took too long to respond');
        }
        if (error.message.includes('fetch')) {
          console.error('❌ Network error:', error.message);
          throw new ApiError(0, 'Network error - Unable to connect to API');
        }
      }
      
      console.error('❌ Unknown error:', error);
      throw new ApiError(0, 'Unknown error occurred');
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, options?: RequestInit, useBearer?: boolean): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' }, useBearer);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit, useBearer?: boolean): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, useBearer);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit, useBearer?: boolean): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, useBearer);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit, useBearer?: boolean): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, useBearer);
  }

  async delete<T>(endpoint: string, options?: RequestInit, useBearer?: boolean): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' }, useBearer);
  }

  /**
   * POST with JSON body but no response body expected (e.g. forgot-password).
   * Uses Basic Auth by default. Does not parse response as JSON on success.
   */
  async postWithBodyNoResponse(
    endpoint: string,
    data: unknown,
    useBearer: boolean = false
  ): Promise<void> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(useBearer
        ? { Authorization: `Bearer ${this.getAuthToken() ?? ''}` }
        : { Authorization: this.getBasicAuthHeader() }),
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const text = await response.text();
      if (!response.ok) {
        let msg = `HTTP error! status: ${response.status}`;
        try {
          const parsed = text ? JSON.parse(text) : {};
          msg =
            (parsed as { messages?: { error?: string }; message?: string }).messages?.error ??
            (parsed as { message?: string }).message ??
            msg;
        } catch {
          if (text) msg = text;
        }
        throw new ApiError(response.status, msg, text);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof ApiError) throw e;
      if (e instanceof Error && e.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout - Please try again');
      }
      throw e;
    }
  }

  /**
   * POST with no response body (e.g. track-view). Uses Bearer auth.
   * Does not parse JSON; avoids errors when API returns empty body.
   */
  async postNoBody(endpoint: string, useBearer: boolean = true): Promise<void> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (useBearer) {
      const token = this.getAuthToken();
      if (!token) throw new ApiError(401, 'Authentication token required');
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = this.getBasicAuthHeader();
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const text = await response.text();
      if (!response.ok) {
        let msg = `HTTP error! status: ${response.status}`;
        try {
          const data = text ? JSON.parse(text) : {};
          msg = (data as any).messages?.error ?? (data as any).message ?? msg;
        } catch {
          if (text) msg = text;
        }
        throw new ApiError(response.status, msg, text);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof ApiError) throw e;
      if (e instanceof Error && e.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout - API took too long to respond');
      }
      throw e;
    }
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Debug function to test API connectivity
export const testApiConnection = async () => {
  // console.log('🧪 Testing API connection...');
  // console.log('🌐 API Base URL:', API_BASE_URL);
  // console.log('🔐 Basic Auth Config:', config.api.basicAuth);
  
  try {
    const response = await apiClient.get('/product/items?page=1&perPage=2', undefined, false);
    // console.log('✅ API connection test successful:', response);
    return response;
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    throw error;
  }
};

// Debug function to test cart API
export const testCartApi = async () => {
  // console.log('🧪 Testing Cart API...');
  
  try {
    const { cartApi } = await import('./cart');
    
    // Test getting cart (should work if user is authenticated)
    const cartResponse = await cartApi.getCart();
    // console.log('📦 Testing get cart...');
    // console.log('✅ Get cart successful:', cartResponse);
    
    return cartResponse;
  } catch (error) {
    console.error('❌ Cart API test failed:', error);
    throw error;
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testApiConnection = testApiConnection;
  (window as any).testCartApi = testCartApi;
}