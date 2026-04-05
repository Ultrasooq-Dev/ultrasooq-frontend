// @ts-expect-error - type mismatch
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Mock the auth request functions
jest.mock('@/apis/requests/auth.requests', () => ({
  login: jest.fn(),
  register: jest.fn(),
  verifyOtp: jest.fn(),
  resendOtp: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  passwordResetVerify: jest.fn(),
  changePassword: jest.fn(),
  changeEmail: jest.fn(),
  emailChangeVerify: jest.fn(),
  socialLogin: jest.fn(),
  myAccounts: jest.fn(),
  createAccount: jest.fn(),
  switchAccount: jest.fn(),
  currentAccount: jest.fn(),
}));

// Mock cookies-next
jest.mock('cookies-next', () => ({
  getCookie: jest.fn(),
  setCookie: jest.fn(),
  deleteCookie: jest.fn(),
}));

// Mock constants
jest.mock('@/utils/constants', () => ({
  ULTRASOOQ_TOKEN_KEY: 'ultrasooq_accessToken',
  ULTRASOOQ_TEMP_TOKEN_KEY: 'ultrasooq_temp_accessToken',
}));

// Mock config/api
jest.mock('@/config/api', () => ({
  getApiUrl: jest.fn(() => 'https://ultrasooq-api.duckdns.org'),
  API_CONFIG: { BASE_URL: 'https://ultrasooq-api.duckdns.org', TIMEOUT: 10000 },
}));

import {
  login,
  register,
  verifyOtp,
} from '@/apis/requests/auth.requests';
import { useLogin, useRegister, useVerifyOtp } from '@/apis/queries/auth.queries';

const mockedLogin = login as jest.MockedFunction<typeof login>;
const mockedRegister = register as jest.MockedFunction<typeof register>;
const mockedVerifyOtp = verifyOtp as jest.MockedFunction<typeof verifyOtp>;

/**
 * Creates a fresh QueryClient and wrapper for each test to avoid shared state.
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return Wrapper;
}

describe('Auth Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useLogin', () => {
    it('should call login API and return tokens', async () => {
      const mockLoginResponse = {
        data: {
          accessToken: 'mock-access-token-xyz',
          data: { status: 'ACTIVE' as const },
          message: 'Login successful',
          status: true,
          otp: 0,
        },
      };

      mockedLogin.mockResolvedValueOnce(mockLoginResponse as any);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      const loginPayload = {
        email: 'test@example.com',
        password: 'password123',
      };

      result.current.mutate(loginPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedLogin).toHaveBeenCalledWith(loginPayload);
      expect(result.current.data).toEqual(mockLoginResponse.data);
      expect(result.current.data?.accessToken).toBe('mock-access-token-xyz');
    });

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        },
      };

      mockedLogin.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockedLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('useRegister', () => {
    it('should call register API', async () => {
      const mockRegisterResponse = {
        data: {
          otp: 123456,
          message: 'Registration successful. Please verify OTP.',
          status: true,
          accessToken: 'temp-token',
        },
      };

      mockedRegister.mockResolvedValueOnce(mockRegisterResponse as any);

      const { result } = renderHook(() => useRegister(), {
        wrapper: createWrapper(),
      });

      const registerPayload = {
        loginType: 'MANUAL' as const,
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'securePassword123',
        cc: '+1',
        phoneNumber: '1234567890',
        tradeRole: 'BUYER',
      };

      result.current.mutate(registerPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedRegister).toHaveBeenCalledWith(registerPayload);
      expect(result.current.data).toEqual(mockRegisterResponse.data);
      expect(result.current.data?.status).toBe(true);
    });

    it('should handle registration failure with duplicate email', async () => {
      const mockError = {
        response: {
          data: { message: 'Email already exists' },
          status: 409,
        },
      };

      mockedRegister.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useRegister(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        loginType: 'MANUAL' as const,
        email: 'existing@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        password: 'password123',
        cc: '+1',
        phoneNumber: '0987654321',
        tradeRole: 'BUYER',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useVerifyOtp', () => {
    it('should call OTP verification', async () => {
      const mockVerifyResponse = {
        data: {
          accessToken: 'verified-access-token',
          data: {
            id: 1,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            firstName: 'John',
            lastName: 'Doe',
            email: 'test@example.com',
            gender: 'MALE' as const,
            tradeRole: 'BUYER' as const,
            cc: '+1',
            phoneNumber: '1234567890',
          },
          message: 'OTP verified successfully',
          status: true,
        },
      };

      mockedVerifyOtp.mockResolvedValueOnce(mockVerifyResponse as any);

      const { result } = renderHook(() => useVerifyOtp(), {
        wrapper: createWrapper(),
      });

      const otpPayload = {
        email: 'test@example.com',
        otp: 123456,
      };

      result.current.mutate(otpPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedVerifyOtp).toHaveBeenCalledWith(otpPayload);
      expect(result.current.data).toEqual(mockVerifyResponse.data);
      expect(result.current.data?.accessToken).toBe('verified-access-token');
    });

    it('should handle invalid OTP', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid OTP' },
          status: 400,
        },
      };

      mockedVerifyOtp.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useVerifyOtp(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        email: 'test@example.com',
        otp: 999999,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockedVerifyOtp).toHaveBeenCalledTimes(1);
    });
  });
});
