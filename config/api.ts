// API Configuration
// CONVENTION: getApiUrl() returns WITHOUT trailing slash
// All API URLs MUST start with "/" (e.g., "/product/search/unified")
export const API_CONFIG = {
  BASE_URL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, ""),
  TIMEOUT: 10000,
};

export const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return API_CONFIG.BASE_URL;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return `http://${hostname}:3000/api/v1`;
  }

  return API_CONFIG.BASE_URL;
};
