import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getApiUrl } from "@/config/api";

const http: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Track 401 handling to prevent multiple simultaneous redirects
let isHandling401 = false;
let consecutive401Count = 0;
let last401Time = 0;

// Request interceptor: set base URL dynamically and attach auth token
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Set baseURL dynamically per request so that getApiUrl() can resolve
    // based on the current window hostname (network IP vs localhost)
    if (!config.baseURL) {
      config.baseURL = getApiUrl();
    }

    const token = getCookie(PUREMOON_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle errors globally with debounced 401 handling
http.interceptors.response.use(
  (response) => {
    // Reset 401 counter on any successful response
    consecutive401Count = 0;
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const now = Date.now();

        // Skip 401 handling on auth pages
        const authPages = ["/login", "/register", "/forget-password", "/reset-password", "/otp-verify"];
        if (authPages.some((page) => currentPath.startsWith(page))) {
          return Promise.reject(error);
        }

        // Track consecutive 401s within a short window
        if (now - last401Time < 5000) {
          consecutive401Count++;
        } else {
          consecutive401Count = 1;
        }
        last401Time = now;

        // Only clear token and redirect after multiple consecutive 401s
        // This prevents logout from a single transient 401
        if (consecutive401Count >= 2 && !isHandling401) {
          isHandling401 = true;
          consecutive401Count = 0;

          // Clear stale token and redirect to login
          document.cookie =
            "puremoon_accessToken=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          window.location.href = "/login";

          // Reset flag after a delay (in case redirect doesn't happen immediately)
          setTimeout(() => {
            isHandling401 = false;
          }, 3000);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default http;
export { http };
