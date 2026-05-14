import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

let apiInstance: AxiosInstance | null = null;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function createApi(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

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

export function initApi(baseURL: string): AxiosInstance {
  apiInstance = createApi(baseURL);
  return apiInstance;
}

export function getApi(): AxiosInstance {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initApi with a base URL first.');
  }
  return apiInstance;
}

export async function testConnection(baseURL: string): Promise<boolean> {
  try {
    const response = await axios.get<ApiResponse>(`${baseURL}/health`, { timeout: 5000 });
    return response.data?.success === true;
  } catch {
    return false;
  }
}

export async function register(
  baseURL: string,
  email: string,
  masterPassword: string
): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
  const response = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
    `${baseURL}/auth/register`,
    { email, password: masterPassword }
  );
  return response.data;
}

export async function login(
  baseURL: string,
  email: string,
  masterPassword: string
): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
  const response = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
    `${baseURL}/auth/login`,
    { email, password: masterPassword }
  );
  return response.data;
}
