/**
 * PRODUCTION-GRADE ACCESS CONTROL HOOK TESTS
 * Covers: All user statuses, permission matrices, route access,
 * sub-account context, edge cases, feature gating
 */
import { renderHook } from '@testing-library/react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useMe } from '@/apis/queries/user.queries';
import { useCurrentAccount } from '@/apis/queries/auth.queries';

jest.mock('@/apis/queries/user.queries', () => ({
  useMe: jest.fn(),
}));

jest.mock('@/apis/queries/auth.queries', () => ({
  useCurrentAccount: jest.fn(),
}));

jest.mock('@/utils/statusCheck', () => ({
  hasRouteAccess: jest.fn((status: string, route: string) => {
    if (status === 'ACTIVE') return true;
    if (['WAITING', 'INACTIVE'].includes(status) && ['profile', 'settings'].includes(route)) return true;
    return false;
  }),
  hasLimitedAccess: jest.fn((status: string) => ['WAITING', 'INACTIVE'].includes(status)),
  hasFullAccess: jest.fn((status: string) => status === 'ACTIVE'),
  getStatusConfig: jest.fn((status: string) => ({ status, label: status.toLowerCase() })),
}));

const mockUseMe = useMe as jest.Mock;
const mockUseCurrentAccount = useCurrentAccount as jest.Mock;

function setupMocks(options: {
  meStatus?: string;
  accountStatus?: string | null;
  isMainAccount?: boolean;
} = {}) {
  mockUseMe.mockReturnValue({
    data: options.meStatus
      ? { data: { data: { status: options.meStatus } } }
      : undefined,
  });

  mockUseCurrentAccount.mockReturnValue({
    data: options.accountStatus
      ? {
          data: {
            account: { status: options.accountStatus },
            isMainAccount: options.isMainAccount ?? true,
          },
        }
      : undefined,
  });
}

describe('useAccessControl — Production Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // STATUS DETECTION
  // ═══════════════════════════════════════════════════════════

  describe('Status detection priority', () => {
    it('prefers currentAccount status over me status', () => {
      setupMocks({ meStatus: 'ACTIVE', accountStatus: 'WAITING' });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.userStatus).toBe('WAITING');
      expect(result.current.isWaiting).toBe(true);
    });

    it('falls back to me status when no currentAccount', () => {
      setupMocks({ meStatus: 'ACTIVE', accountStatus: null });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.userStatus).toBe('ACTIVE');
      expect(result.current.isActive).toBe(true);
    });

    it('defaults to WAITING when neither source provides status', () => {
      setupMocks({});

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.userStatus).toBe('WAITING');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ACTIVE USER — FULL ACCESS
  // ═══════════════════════════════════════════════════════════

  describe('ACTIVE status — Full access', () => {
    beforeEach(() => setupMocks({ accountStatus: 'ACTIVE' }));

    it('has full access flags', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isActive).toBe(true);
      expect(result.current.hasFullAccess).toBe(true);
      expect(result.current.hasLimitedAccess).toBe(false);
    });

    it.each([
      'canManageProducts',
      'canManageServices',
      'canAccessOrders',
      'canAccessRFQ',
      'canAccessDashboard',
      'canAccessTransactions',
      'canAccessQueries',
      'canAccessTeamMembers',
      'canAccessShareLinks',
      'canAccessSellerRewards',
      'canCreateSubAccounts',
      'canSwitchAccounts',
    ] as const)('%s is true', (permission) => {
      const { result } = renderHook(() => useAccessControl());
      expect(result.current[permission]).toBe(true);
    });

    it.each([
      'canAccessProfile',
      'canAccessSettings',
      'canAccessAccounts',
      'canEditProfile',
    ] as const)('%s is true', (permission) => {
      const { result } = renderHook(() => useAccessControl());
      expect(result.current[permission]).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // WAITING STATUS — LIMITED ACCESS
  // ═══════════════════════════════════════════════════════════

  describe('WAITING status — Limited access', () => {
    beforeEach(() => setupMocks({ accountStatus: 'WAITING' }));

    it('has limited access flags', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isWaiting).toBe(true);
      expect(result.current.hasFullAccess).toBe(false);
      expect(result.current.hasLimitedAccess).toBe(true);
    });

    it.each([
      'canManageProducts',
      'canManageServices',
      'canAccessOrders',
      'canAccessRFQ',
      'canAccessDashboard',
      'canAccessTransactions',
      'canCreateSubAccounts',
      'canSwitchAccounts',
    ] as const)('%s is false', (permission) => {
      const { result } = renderHook(() => useAccessControl());
      expect(result.current[permission]).toBe(false);
    });

    it('can still access profile and settings', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canAccessProfile).toBe(true);
      expect(result.current.canAccessSettings).toBe(true);
      expect(result.current.canEditProfile).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // INACTIVE STATUS
  // ═══════════════════════════════════════════════════════════

  describe('INACTIVE status', () => {
    beforeEach(() => setupMocks({ accountStatus: 'INACTIVE' }));

    it('is flagged as inactive', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isInactive).toBe(true);
      expect(result.current.isActive).toBe(false);
    });

    it('can access profile but not orders', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canAccessProfile).toBe(true);
      expect(result.current.canAccessOrders).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // REJECT STATUS
  // ═══════════════════════════════════════════════════════════

  describe('REJECT status', () => {
    beforeEach(() => setupMocks({ accountStatus: 'REJECT' }));

    it('is flagged as rejected', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isRejected).toBe(true);
    });

    it('cannot access anything feature-gated', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canManageProducts).toBe(false);
      expect(result.current.canAccessOrders).toBe(false);
      expect(result.current.canAccessDashboard).toBe(false);
      expect(result.current.canAccessProfile).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ROUTE ACCESS
  // ═══════════════════════════════════════════════════════════

  describe('Route access control', () => {
    it('ACTIVE user can access any route', () => {
      setupMocks({ accountStatus: 'ACTIVE' });
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canAccessRoute('products')).toBe(true);
      expect(result.current.canAccessRoute('orders')).toBe(true);
      expect(result.current.canAccessRoute('dashboard')).toBe(true);
    });

    it('WAITING user can only access profile/settings routes', () => {
      setupMocks({ accountStatus: 'WAITING' });
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canAccessRoute('profile')).toBe(true);
      expect(result.current.canAccessRoute('settings')).toBe(true);
      expect(result.current.canAccessRoute('products')).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SUB-ACCOUNT CONTEXT
  // ═══════════════════════════════════════════════════════════

  describe('Sub-account context', () => {
    it('exposes currentAccount data', () => {
      setupMocks({ accountStatus: 'ACTIVE', isMainAccount: false });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.currentAccount).toBeDefined();
      expect(result.current.isMainAccount).toBe(false);
    });

    it('isMainAccount is true for parent accounts', () => {
      setupMocks({ accountStatus: 'ACTIVE', isMainAccount: true });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isMainAccount).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════

  describe('Edge cases', () => {
    it('handles unknown status string', () => {
      setupMocks({ accountStatus: 'UNKNOWN_STATUS' });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isActive).toBe(false);
      expect(result.current.isWaiting).toBe(false);
      expect(result.current.canManageProducts).toBe(false);
    });

    it('handles empty string status', () => {
      setupMocks({ accountStatus: '' });

      const { result } = renderHook(() => useAccessControl());

      // Falls through to me status or default
      expect(result.current.userStatus).toBeDefined();
    });
  });
});
