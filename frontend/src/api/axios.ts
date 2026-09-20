import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api';

export const ACCESS_TOKEN_KEY = 'campus_bazaar_access_token';
export const REFRESH_TOKEN_KEY = 'campus_bazaar_refresh_token';
export const AUTH_LOGOUT_EVENT = 'campus-bazaar:auth-logout';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearAuthTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers);
    }
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

const refreshClient = axios.create({ baseURL: BASE_URL });
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refresh) {
      throw new Error('No refresh token available');
    }

    refreshPromise = refreshClient
      .post<{ access: string }>('/auth/token/refresh/', { refresh })
      .then(({ data }) => {
        setAccessToken(data.access);
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequestConfig | undefined;
    const isRefreshRequest = request?.url?.includes('/auth/token/refresh/');

    if (error.response?.status === 401 && request && !request._retry && !isRefreshRequest) {
      request._retry = true;
      try {
        const token = await refreshAccessToken();
        if (!(request.headers instanceof AxiosHeaders)) {
          request.headers = new AxiosHeaders(request.headers);
        }
        request.headers.set('Authorization', `Bearer ${token}`);
        return axiosInstance(request);
      } catch (refreshError) {
        clearAuthTokens();
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
