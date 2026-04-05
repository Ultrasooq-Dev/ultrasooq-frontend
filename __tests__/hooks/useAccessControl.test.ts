// @ts-expect-error - type mismatch
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Mock the query hooks
jest.mock('@/apis/queries/user.queries', () => ({
  useMe: jest.fn(),
}));

jest.mock('@/apis/queries/auth.queries', () => ({
  useCurrentAccount: jest.fn(),
}));

import { useMe } from '@/apis/queries/user.queries';
import { useCurrentAccount } from '@/apis/queries/auth.queries';
import { useAccessControl } from '@/hooks/useAccessControl';

const mockedUseMe = useMe as jest.MockedFunction<typeof useMe>;
const mockedUseCurrentAccount = useCurrentAccount as jest.MockedFunction<typeof useCurrentAccount>;

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

describe('useAccessControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns full access for ACTIVE account from currentAccount', () => {
    mockedUseCurrentAccount.mockReturnValue({
      data: { data: { account: { status: 'ACTIVE' }, isMainAccount: true } },
    } as any);
    mockedUseMe.mockReturnValue({ data: undefined } as any);

    const { result } = renderHook(() => useAccessControl(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.isWaiting).toBe(false);
    expect(result.current.hasFullAccess).toBe(true);
    expect(result.current.hasLimitedAccess).toBe(false);
    expect(result.current.canManageProducts).toBe(true);
    expect(result.current.canAccessOrders).toBe(true);
    expect(result.current.canAccessDashboard).toBe(true);
    expect(result.current.canAccessTeamMembers).toBe(true);
    expect(result.current.canCreateSubAccounts).toBe(true);
    expect(result.current.canAccessRoute('manage-products')).toBe(true);
    expect(result.current.canAccessRoute('my-settings')).toBe(true);
  });

  it('returns limited access for WAITING account', () => {
    mockedUseCurrentAccount.mockReturnValue({
      data: { data: { account: { status: 'WAITING' }, isMainAccount: false } },
    } as any);
    mockedUseMe.mockReturnValue({ data: undefined } as any);

    const { result } = renderHook(() => useAccessControl(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.isWaiting).toBe(true);
    expect(result.current.hasFullAccess).toBe(false);
    expect(result.current.hasLimitedAccess).toBe(true);
    expect(result.current.canManageProducts).toBe(false);
    expect(result.current.canAccessOrders).toBe(false);
    expect(result.current.canAccessProfile).toBe(true);
    expect(result.current.canAccessSettings).toBe(true);
    expect(result.current.canAccessRoute('manage-products')).toBe(false);
    expect(result.current.canAccessRoute('my-settings')).toBe(true);
  });

  it('falls back to me.data.data.status when currentAccount is undefined', () => {
    mockedUseCurrentAccount.mockReturnValue({ data: undefined } as any);
    mockedUseMe.mockReturnValue({
      data: { data: { data: { status: 'INACTIVE' } } },
    } as any);

    const { result } = renderHook(() => useAccessControl(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isInactive).toBe(true);
    expect(result.current.isActive).toBe(false);
    expect(result.current.hasFullAccess).toBe(false);
    expect(result.current.canManageProducts).toBe(false);
    expect(result.current.canAccessProfile).toBe(true);
    expect(result.current.canEditProfile).toBe(true);
  });

  it('defaults to WAITING when both sources are undefined', () => {
    mockedUseCurrentAccount.mockReturnValue({ data: undefined } as any);
    mockedUseMe.mockReturnValue({ data: undefined } as any);

    const { result } = renderHook(() => useAccessControl(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isWaiting).toBe(true);
    expect(result.current.userStatus).toBe('WAITING');
    expect(result.current.hasFullAccess).toBe(false);
    expect(result.current.hasLimitedAccess).toBe(true);
  });

  it('returns REJECT flags correctly', () => {
    mockedUseCurrentAccount.mockReturnValue({
      data: { data: { account: { status: 'REJECT' }, isMainAccount: false } },
    } as any);
    mockedUseMe.mockReturnValue({ data: undefined } as any);

    const { result } = renderHook(() => useAccessControl(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isRejected).toBe(true);
    expect(result.current.isActive).toBe(false);
    expect(result.current.hasFullAccess).toBe(false);
    expect(result.current.hasLimitedAccess).toBe(false);
    expect(result.current.canAccessProfile).toBe(false);
    expect(result.current.canManageProducts).toBe(false);
  });

  it('exposes currentAccount and isMainAccount', () => {
    const mockAccount = { status: 'ACTIVE', id: 1, name: 'Test' };
    mockedUseCurrentAccount.mockReturnValue({
      data: { data: { account: mockAccount, isMainAccount: true } },
    } as any);
    mockedUseMe.mockReturnValue({ data: undefined } as any);

    const { result } = renderHook(() => useAccessControl(), {
      wrapper: createWrapper(),
    });

    expect(result.current.currentAccount).toEqual(mockAccount);
    expect(result.current.isMainAccount).toBe(true);
  });
});
