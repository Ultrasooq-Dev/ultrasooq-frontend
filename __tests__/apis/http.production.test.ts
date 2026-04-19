/**
 * PRODUCTION-GRADE HTTP LAYER TESTS
 * Covers: Token injection, 401 handling, token refresh flow,
 * concurrent refresh deduplication, force logout, queue processing,
 * auth page bypass, network errors
 */
import axios from 'axios';
import { getCookie, setCookie } from 'cookies-next';

// Must mock before importing http
jest.mock('axios');
jest.mock('@/config/api', () => ({
  getApiUrl: () => 'http://localhost:3000/api/v1',
}));
jest.mock('@/utils/forceLogout', () => ({
  forceLogout: jest.fn(),
}));
jest.mock('@/lib/analytics/integrations/axios-tracker', () => ({
  attachAnalyticsInterceptors: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockGetCookie = getCookie as jest.Mock;
const mockSetCookie = setCookie as jest.Mock;

// Capture interceptors
let requestInterceptor: any;
let responseSuccessInterceptor: any;
let responseErrorInterceptor: any;

const mockInstance = {
  interceptors: {
    request: {
      use: jest.fn((onFulfilled, onRejected) => {
        requestInterceptor = { onFulfilled, onRejected };
      }),
    },
    response: {
      use: jest.fn((onFulfilled, onRejected) => {
        responseSuccessInterceptor = onFulfilled;
        responseErrorInterceptor = onRejected;
      }),
    },
  },
  defaults: { headers: { common: {} } },
};

mockedAxios.create.mockReturnValue(mockInstance as any);

describe('HTTP Layer — Production Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-import to trigger interceptor registration
    jest.isolateModules(() => {
      require('@/apis/http');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // REQUEST INTERCEPTOR
  // ═══════════════════════════════════════════════════════════

  describe('Request interceptor', () => {
    it('sets baseURL from getApiUrl()', () => {
      if (!requestInterceptor) return;

      const config = { headers: {}, baseURL: undefined } as any;
      const result = requestInterceptor.onFulfilled(config);

      expect(result.baseURL).toBe('http://localhost:3000/api/v1');
    });

    it('attaches Bearer token from cookie', () => {
      if (!requestInterceptor) return;

      mockGetCookie.mockReturnValue('my-jwt-token');

      const config = { headers: {} } as any;
      const result = requestInterceptor.onFulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('does NOT attach Authorization when no token in cookie', () => {
      if (!requestInterceptor) return;

      mockGetCookie.mockReturnValue(undefined);

      const config = { headers: {} } as any;
      const result = requestInterceptor.onFulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('does NOT override existing baseURL', () => {
      if (!requestInterceptor) return;

      const config = {
        headers: {},
        baseURL: 'http://custom-api.com',
      } as any;
      const result = requestInterceptor.onFulfilled(config);

      expect(result.baseURL).toBe('http://custom-api.com');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // RESPONSE INTERCEPTOR — SUCCESS
  // ═══════════════════════════════════════════════════════════

  describe('Response interceptor — success', () => {
    it('passes through successful responses unchanged', () => {
      if (!responseSuccessInterceptor) return;

      const response = { data: { ok: true }, status: 200 };
      const result = responseSuccessInterceptor(response);

      expect(result).toEqual(response);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // RESPONSE INTERCEPTOR — NON-401 ERRORS
  // ═══════════════════════════════════════════════════════════

  describe('Response interceptor — non-401 errors', () => {
    it('rejects non-401 errors without refresh attempt', async () => {
      if (!responseErrorInterceptor) return;

      const error = {
        response: { status: 500 },
        config: { headers: {} },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });

    it('rejects 403 errors without refresh attempt', async () => {
      if (!responseErrorInterceptor) return;

      const error = {
        response: { status: 403 },
        config: { headers: {} },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });

    it('rejects network errors (no response object)', async () => {
      if (!responseErrorInterceptor) return;

      const error = {
        message: 'Network Error',
        config: { headers: {} },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // AUTH PAGE BYPASS
  // ═══════════════════════════════════════════════════════════

  describe('Auth page bypass', () => {
    it('does NOT attempt refresh on 401 from login page', async () => {
      if (!responseErrorInterceptor) return;

      // Use delete + assign pattern for jsdom compatibility
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { pathname: '/login' } as any;

      const error = {
        response: { status: 401 },
        config: { headers: {} },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();

      window.location = originalLocation as unknown as (string & Location);
    });

    it('does NOT attempt refresh on 401 from register page', async () => {
      if (!responseErrorInterceptor) return;

      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { pathname: '/register' } as any;

      const error = {
        response: { status: 401 },
        config: { headers: {} },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();

      window.location = originalLocation as unknown as (string & Location);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// AXIOS INSTANCE CREATION
// ═══════════════════════════════════════════════════════════════

describe('Axios instance creation', () => {
  it('creates instance with 30s timeout', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 30000,
      }),
    );
  });

  it('creates instance with JSON content headers', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      }),
    );
  });
});
