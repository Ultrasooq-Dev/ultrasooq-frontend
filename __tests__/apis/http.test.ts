import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from 'axios';
import { getCookie } from 'cookies-next';
import { PUREMOON_TOKEN_KEY } from '@/utils/constants';
import { getApiUrl } from '@/config/api';

// Mock dependencies
jest.mock('axios', () => {
  const mockInterceptors = {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  };

  const mockInstance = {
    interceptors: mockInterceptors,
    defaults: { headers: { common: {} } },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  };

  const mockAxios: any = jest.fn(() => mockInstance);
  mockAxios.create = jest.fn(() => mockInstance);
  mockAxios.isAxiosError = jest.fn();

  return {
    __esModule: true,
    default: mockAxios,
    ...mockAxios,
  };
});

jest.mock('cookies-next', () => ({
  getCookie: jest.fn(),
  setCookie: jest.fn(),
  deleteCookie: jest.fn(),
}));

jest.mock('@/config/api', () => ({
  getApiUrl: jest.fn(() => 'https://ultrasooq-api.duckdns.org'),
}));

jest.mock('@/utils/constants', () => ({
  PUREMOON_TOKEN_KEY: 'puremoon_accessToken',
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetCookie = getCookie as jest.MockedFunction<typeof getCookie>;
const mockedGetApiUrl = getApiUrl as jest.MockedFunction<typeof getApiUrl>;

describe('HTTP Client (apis/http.ts)', () => {
  let requestInterceptorFulfill: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  let requestInterceptorReject: (error: any) => Promise<any>;
  let responseInterceptorFulfill: (response: AxiosResponse) => AxiosResponse;
  let responseInterceptorReject: (error: any) => Promise<any>;
  let mockInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-create mock instance structure
    mockInstance = (mockedAxios.create as jest.Mock).mock.results[0]?.value || {
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    };

    // Clear module cache so http.ts is re-evaluated
    jest.resetModules();
  });

  /**
   * Helper to load the http module fresh and capture interceptors.
   */
  async function loadHttpModule() {
    // Reset modules so the http.ts file is freshly required
    jest.resetModules();

    // Re-setup the mocks after resetModules
    jest.doMock('axios', () => {
      const interceptors = {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      };
      const instance = {
        interceptors,
        defaults: { headers: { common: {} } },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
      };
      const mock: any = jest.fn(() => instance);
      mock.create = jest.fn(() => instance);
      mock.isAxiosError = jest.fn();
      return { __esModule: true, default: mock, ...mock };
    });

    jest.doMock('cookies-next', () => ({
      getCookie: jest.fn(),
      setCookie: jest.fn(),
      deleteCookie: jest.fn(),
    }));

    jest.doMock('@/config/api', () => ({
      getApiUrl: jest.fn(() => 'https://ultrasooq-api.duckdns.org'),
    }));

    jest.doMock('@/utils/constants', () => ({
      PUREMOON_TOKEN_KEY: 'puremoon_accessToken',
    }));

    const axiosMod = require('axios');
    const httpModule = require('@/apis/http');
    const instance = axiosMod.default.create.mock.results[0]?.value;

    // Capture interceptors
    if (instance) {
      const reqUse = instance.interceptors.request.use;
      if (reqUse.mock.calls.length > 0) {
        requestInterceptorFulfill = reqUse.mock.calls[0][0];
        requestInterceptorReject = reqUse.mock.calls[0][1];
      }

      const resUse = instance.interceptors.response.use;
      if (resUse.mock.calls.length > 0) {
        responseInterceptorFulfill = resUse.mock.calls[0][0];
        responseInterceptorReject = resUse.mock.calls[0][1];
      }
    }

    return { httpModule, axiosMod, instance };
  }

  describe('Axios Instance Creation', () => {
    it('should create axios instance with 30s timeout', async () => {
      const { axiosMod } = await loadHttpModule();

      expect(axiosMod.default.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        })
      );
    });

    it('should set Content-Type and Accept headers', async () => {
      const { axiosMod } = await loadHttpModule();

      expect(axiosMod.default.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      );
    });
  });

  describe('Request Interceptor', () => {
    it('should set baseURL dynamically', async () => {
      const { instance } = await loadHttpModule();
      const { getApiUrl: mockGetApiUrl } = require('@/config/api');
      mockGetApiUrl.mockReturnValue('https://custom-api.example.com');

      const config: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
      };

      const result = requestInterceptorFulfill(config);
      expect(result.baseURL).toBe('https://custom-api.example.com');
    });

    it('should attach Bearer token when cookie exists', async () => {
      await loadHttpModule();
      const { getCookie: mockGetCookie } = require('cookies-next');
      mockGetCookie.mockReturnValue('test-token-abc123');

      const config: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
      };

      const result = requestInterceptorFulfill(config);
      expect(result.headers.Authorization).toBe('Bearer test-token-abc123');
    });

    it('should not attach token when no cookie', async () => {
      await loadHttpModule();
      const { getCookie: mockGetCookie } = require('cookies-next');
      mockGetCookie.mockReturnValue(undefined);

      const config: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
      };

      const result = requestInterceptorFulfill(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should reject with error on request interceptor failure', async () => {
      await loadHttpModule();
      const error = new Error('Request failed');

      await expect(requestInterceptorReject(error)).rejects.toThrow('Request failed');
    });
  });

  describe('Response Interceptor', () => {
    it('should pass through successful responses', async () => {
      await loadHttpModule();

      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      const result = responseInterceptorFulfill(mockResponse);
      expect(result).toBe(mockResponse);
      expect(result.data).toEqual({ success: true });
    });

    it('should handle 401 errors', async () => {
      await loadHttpModule();

      const axiosError: Partial<AxiosError> = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Token expired' },
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 401',
        toJSON: () => ({}),
      };

      await expect(responseInterceptorReject(axiosError)).rejects.toBe(axiosError);
    });

    it('should reject non-401 errors', async () => {
      await loadHttpModule();

      const axiosError: Partial<AxiosError> = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server Error' },
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 500',
        toJSON: () => ({}),
      };

      await expect(responseInterceptorReject(axiosError)).rejects.toBe(axiosError);
    });
  });
});
