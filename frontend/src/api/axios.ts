// src/api/axios.ts
//
// Configured Axios instance for the Campus Bazaar API.
//
// Token strategy:
// - Access token lives in JS memory only (module-level variable below) —
//   never localStorage/sessionStorage, so it can't be exfiltrated by an
//   injected script and doesn't survive a hard reload on its own.
// - Refresh token is an httpOnly, Secure, SameSite cookie set by the
//   backend. This file never reads or writes it directly; it just sends
//   `withCredentials: true` so the cookie rides along automatically.

import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { RefreshResponse } from '../types/api';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

// ---------------------------------------------------------------------------
// In-memory access token store
// ---------------------------------------------------------------------------

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Dispatched when the refresh token itself turns out to be invalid or
 * expired — i.e. the session is truly over and the user must log in
 * again. AuthContext listens for this to clear its state and redirect,
 * so this file doesn't need to import React or the auth context (which
 * would create a circular dependency, since the context imports this
 * file to make requests).
 */
export const AUTH_LOGOUT_EVENT = 'campus-bazaar:auth-logout';

function forceLogout(): void {
  setAccessToken(null);
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}

// ---------------------------------------------------------------------------
// Main instance
// ---------------------------------------------------------------------------

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie on every request
});

// Attach the current access token to every outgoing request.
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers);
    }
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// A separate, bare client for the refresh call itself. Using
// `axiosInstance` here would route the refresh request back through the
// response interceptor below and could recurse on a 401.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/**
 * Shared in-flight refresh promise.
 *
 * The problem this solves: if five requests fire at once and all get a
 * 401 (e.g. an expired access token right after a page load), each one
 * lands in the response interceptor below. Without this guard, each
 * would independently call POST /auth/refresh/. Most refresh-token
 * implementations rotate the token on use, so only the first of those
 * calls succeeds — the other four then retry with a token that was
 * already invalidated and fail permanently, even though the session is
 * fine. Routing every caller through the same promise means only one
 * network call happens, and everyone waits on its result.
 */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<RefreshResponse>('/auth/refresh/')
      .then((res) => {
        const newToken = res.data.access;
        setAccessToken(newToken);
        return newToken;
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
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh/');
    const alreadyRetried = originalRequest?._retry;

    if (isUnauthorized && originalRequest && !isRefreshCall && !alreadyRetried) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (!(originalRequest.headers instanceof AxiosHeaders)) {
          originalRequest.headers = new AxiosHeaders(originalRequest.headers);
        }
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);