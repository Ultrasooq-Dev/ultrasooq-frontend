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

// Response interceptor: handle errors globally
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — redirect to login
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          // Clear stale token and redirect to login
          document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default http;
export { http };
