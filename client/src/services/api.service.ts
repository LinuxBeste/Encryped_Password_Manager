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

// Create an Axios instance with auth interceptor and token refresh
function createApi(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach Bearer token to every request
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
