import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { getCookie, setCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY, ULTRASOOQ_REFRESH_TOKEN_KEY } from "@/utils/constants";
import { getApiUrl } from "@/config/api";
import { forceLogout } from "@/utils/forceLogout";

const http: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Token refresh state ───────────────────────────────────────
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

/**
 * Process all queued requests after a token refresh attempt.
 * If the refresh succeeded, retry each request with the new token.
 * If the refresh failed, reject all queued requests.
 */
function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

// forceLogout is imported from @/utils/forceLogout
// It revokes the refresh token on backend, clears cookies, signs out NextAuth, then redirects.

// ─── Request interceptor ──────────────────────────────────────
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.baseURL) {
      config.baseURL = getApiUrl();
    }

    const token = getCookie(ULTRASOOQ_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Request tracking — unique ID for end-to-end tracing
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    config.headers["X-Request-Id"] = requestId;
    (config as any)._requestId = requestId;
    (config as any)._startTime = Date.now();

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: auto-refresh on 401 ───────────────
http.interceptors.response.use(
  (response) => {
    // Log successful response with tracking
    if (process.env.NODE_ENV === "development") {
      const rid = (response.config as any)?._requestId;
      const dur = Date.now() - ((response.config as any)?._startTime || 0);
      if (rid) console.debug(`[${rid}] ← ${response.status} (${dur}ms)`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 errors
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Skip refresh on auth pages
    if (typeof window !== "undefined") {
      const authPages = ["/login", "/register", "/forget-password", "/reset-password", "/otp-verify"];
      if (authPages.some((page) => window.location.pathname.startsWith(page))) {
        return Promise.reject(error);
      }
    }

    // If this request was already retried after a refresh, don't retry again
    if (originalRequest._retry) {
      forceLogout();
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(http(originalRequest));
          },
          reject: (err: unknown) => {
            reject(err);
          },
        });
      });
    }

    // Attempt to refresh the token
    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getCookie(ULTRASOOQ_REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      // No refresh token — force logout
      isRefreshing = false;
      processQueue(error, null);
      forceLogout();
      return Promise.reject(error);
    }

    try {
      // Call the backend refresh endpoint directly (not through http to avoid interceptor loop)
      const baseUrl = getApiUrl();
      const response = await axios.post(`${baseUrl}/auth/refresh`, {
        refreshToken,
      });

      if (response.data?.status && response.data?.accessToken) {
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        // Store new tokens
        setCookie(ULTRASOOQ_TOKEN_KEY, newAccessToken, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
        if (newRefreshToken) {
          setCookie(ULTRASOOQ_REFRESH_TOKEN_KEY, newRefreshToken, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          });
        }

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Process queued requests
        processQueue(null, newAccessToken);

        return http(originalRequest);
      } else {
        // Refresh endpoint returned non-success
        processQueue(error, null);
        forceLogout();
        return Promise.reject(error);
      }
    } catch (refreshError) {
      // Refresh failed — session expired, force logout
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// Attach analytics interceptors (Channel A piggyback — zero extra API calls)
import { attachAnalyticsInterceptors } from '@/lib/analytics/integrations/axios-tracker';
attachAnalyticsInterceptors(http);

export default http;
export { http };
