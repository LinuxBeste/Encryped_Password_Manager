import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

let apiInstance: AxiosInstance | null = null;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

// Store access and refresh tokens
export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

// Clear stored tokens
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

// Get the current access token
export function getAccessToken(): string | null {
  return accessToken;
}

// Read a cookie value by name
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

// Create an Axios instance with auth interceptor and token refresh
function createApi(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach Bearer token and CSRF token to every request
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (config.headers) {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      const csrfToken = getCookie('csrf-token');
      if (csrfToken && config.method && !['get', 'head', 'options'].includes(config.method)) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }
    return config;
  });

  // Intercept 401 responses and attempt token refresh
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
        originalRequest._retry = true;

        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }

        const refreshed = await refreshPromise;
        refreshPromise = null;

        if (refreshed && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// Try to refresh tokens via the API
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
      `${apiInstance?.defaults.baseURL}/auth/refresh`,
      { refreshToken }
    );
    if (response.data.success && response.data.data) {
      accessToken = response.data.data.token;
      refreshToken = response.data.data.refreshToken;
      return true;
    }
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

// Initialize the API client with a base URL
export function initApi(baseURL: string): AxiosInstance {
  apiInstance = createApi(baseURL);
  return apiInstance;
}

// Get the existing API client instance
export function getApi(): AxiosInstance {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initApi with a base URL first.');
  }
  return apiInstance;
}

// Test connectivity to the server health endpoint
export async function testConnection(baseURL: string): Promise<boolean> {
  try {
    const response = await axios.get<ApiResponse>(`${baseURL}/health`, { timeout: 5000 });
    return response.data?.success === true;
  } catch {
    return false;
  }
}

// Register a new user account
export async function register(
  baseURL: string,
  email: string,
  masterPassword: string
): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
  const response = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
    `${baseURL}/auth/register`,
    { email, masterPassword }
  );
  return response.data;
}

// Log in with email and master password
export async function login(
  baseURL: string,
  email: string,
  masterPassword: string
): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
  const response = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
    `${baseURL}/auth/login`,
    { email, masterPassword }
  );
  return response.data;
}

// Get TOTP 2FA status for the authenticated user
export async function getTotpStatus(api: AxiosInstance): Promise<ApiResponse<{ enabled: boolean }>> {
  const response = await api.get<ApiResponse<{ enabled: boolean }>>('/auth/totp/status');
  return response.data;
}

// Set up TOTP 2FA — generates a secret and returns QR code
export async function setupTotp(api: AxiosInstance): Promise<ApiResponse<{ secret: string; qrCode: string; otpauth: string }>> {
  const response = await api.post<ApiResponse<{ secret: string; qrCode: string; otpauth: string }>>('/auth/totp/setup');
  return response.data;
}

// Verify a TOTP code to confirm setup
export async function verifyTotp(api: AxiosInstance, code: string): Promise<ApiResponse<{ verified: boolean }>> {
  const response = await api.post<ApiResponse<{ verified: boolean }>>('/auth/totp/verify', { code });
  return response.data;
}

// Disable/remove TOTP 2FA
export async function disableTotp(api: AxiosInstance): Promise<ApiResponse> {
  const response = await api.delete('/auth/totp');
  return response.data;
}
