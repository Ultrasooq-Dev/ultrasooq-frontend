// API Configuration
export const API_CONFIG = {
  BASE_URL:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1", // Backend API URL - defaults to local dev
  TIMEOUT: 10000,
};

// Fallback for development - dynamically detect hostname
export const getApiUrl = () => {
  // If API URL is explicitly set in env, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return API_CONFIG.BASE_URL;
  }

  // In browser, detect current hostname and use same IP for backend
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If accessed via network IP, use network IP for backend
    // If accessed via localhost, use localhost for backend
    return `http://${hostname}:3000`;
  }

  // Server-side: default to localhost
  return API_CONFIG.BASE_URL;
};
