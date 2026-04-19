import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Mock cart request functions
jest.mock('@/apis/requests/cart.requests', () => ({
  updateCartWithLogin: jest.fn(),
  updateCartByDevice: jest.fn(),
  deleteCartItem: jest.fn(),
  deleteServiceFromCart: jest.fn(),
  fetchCartByUserId: jest.fn(),
  fetchCartByDevice: jest.fn(),
  fetchCartCountWithLogin: jest.fn(),
  fetchCartCountByDeviceId: jest.fn(),
  updateUserCartByDeviceId: jest.fn(),
  updateCartWithService: jest.fn(),
  addServiceToCartWithProduct: jest.fn(),
  fetchCartRecommendations: jest.fn(),
}));

// Mock cookies-next
jest.mock('cookies-next', () => ({
  getCookie: jest.fn(),
  setCookie: jest.fn(),
  deleteCookie: jest.fn(),
}));

// Mock config/api
jest.mock('@/config/api', () => ({
  getApiUrl: jest.fn(() => 'https://ultrasooq-api.duckdns.org'),
  API_CONFIG: { BASE_URL: 'https://ultrasooq-api.duckdns.org', TIMEOUT: 10000 },
}));

import {
  updateCartWithLogin,
  updateCartByDevice,
  deleteCartItem,
  deleteServiceFromCart,
} from '@/apis/requests/cart.requests';
import {
  useUpdateCartWithLogin,
  useUpdateCartByDevice,
  useDeleteCartItem,
  useDeleteServiceFromCart,
} from '@/apis/queries/cart.queries';

const mockedUpdateCartWithLogin = updateCartWithLogin as jest.MockedFunction<typeof updateCartWithLogin>;
const mockedUpdateCartByDevice = updateCartByDevice as jest.MockedFunction<typeof updateCartByDevice>;
const mockedDeleteCartItem = deleteCartItem as jest.MockedFunction<typeof deleteCartItem>;
const mockedDeleteServiceFromCart = deleteServiceFromCart as jest.MockedFunction<typeof deleteServiceFromCart>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return Wrapper;
}

describe('Cart Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useUpdateCartWithLogin', () => {
    it('should call updateCartWithLogin with correct payload', async () => {
      const mockResponse = {
        data: { success: true, message: 'Cart updated', data: {} },
      };
      mockedUpdateCartWithLogin.mockResolvedValueOnce(mockResponse as any);

      const { result } = renderHook(() => useUpdateCartWithLogin(), {
        wrapper: createWrapper(),
      });

      const payload = { productPriceId: 1, quantity: 2 };
      result.current.mutate(payload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedUpdateCartWithLogin).toHaveBeenCalledWith(payload);
      expect(result.current.data).toEqual(mockResponse.data);
    });

    it('should handle update cart failure', async () => {
      const mockError = {
        response: { data: { message: 'Product not found' }, status: 404 },
      };
      mockedUpdateCartWithLogin.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useUpdateCartWithLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ productPriceId: 999, quantity: 1 });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockedUpdateCartWithLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('useUpdateCartByDevice', () => {
    it('should call updateCartByDevice with deviceId', async () => {
      const mockResponse = {
        data: { success: true, message: 'Cart updated', data: {} },
      };
      mockedUpdateCartByDevice.mockResolvedValueOnce(mockResponse as any);

      const { result } = renderHook(() => useUpdateCartByDevice(), {
        wrapper: createWrapper(),
      });

      const payload = { productPriceId: 5, quantity: 3, deviceId: 'device_123' };
      result.current.mutate(payload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedUpdateCartByDevice).toHaveBeenCalledWith(payload);
    });

    it('should handle device cart failure', async () => {
      mockedUpdateCartByDevice.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUpdateCartByDevice(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ productPriceId: 1, quantity: 1, deviceId: 'device_456' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useDeleteCartItem', () => {
    it('should call deleteCartItem with cartId', async () => {
      const mockResponse = {
        data: { success: true, message: 'Item removed', data: {} },
      };
      mockedDeleteCartItem.mockResolvedValueOnce(mockResponse as any);

      const { result } = renderHook(() => useDeleteCartItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ cartId: 42 });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedDeleteCartItem).toHaveBeenCalledWith({ cartId: 42 });
      expect(result.current.data).toEqual(mockResponse.data);
    });

    it('should handle delete failure', async () => {
      mockedDeleteCartItem.mockRejectedValueOnce({
        response: { data: { message: 'Cart item not found' }, status: 404 },
      });

      const { result } = renderHook(() => useDeleteCartItem(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ cartId: 999 });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useDeleteServiceFromCart', () => {
    it('should call deleteServiceFromCart with cartId', async () => {
      const mockResponse = {
        data: { success: true, message: 'Service removed', data: {} },
      };
      mockedDeleteServiceFromCart.mockResolvedValueOnce(mockResponse as any);

      const { result } = renderHook(() => useDeleteServiceFromCart(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ cartId: 10, serviceFeatureId: 5 });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedDeleteServiceFromCart).toHaveBeenCalledWith(10, 5);
    });
  });
});
