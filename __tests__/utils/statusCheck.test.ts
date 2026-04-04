import {
  isStatusAllowed,
  getUserStatusInfo,
  getStatusConfig,
  isValidStatusTransition,
  getAvailableStatusTransitions,
  hasRouteAccess,
  hasLimitedAccess,
  hasFullAccess,
  getUnauthorizedRedirect,
  getRouteProtection,
} from '@/utils/statusCheck';

describe('Status Check Utilities', () => {
  describe('isStatusAllowed', () => {
    it('returns true when status is in allowed list', () => {
      expect(isStatusAllowed('ACTIVE', ['ACTIVE', 'WAITING'])).toBe(true);
    });

    it('returns false when status is not in allowed list', () => {
      expect(isStatusAllowed('REJECT', ['ACTIVE', 'WAITING'])).toBe(false);
    });

    it('returns false for empty allowed list', () => {
      expect(isStatusAllowed('ACTIVE', [])).toBe(false);
    });
  });

  describe('getUserStatusInfo', () => {
    it('returns correct flags for ACTIVE status', () => {
      const result = getUserStatusInfo({ data: { status: 'ACTIVE' } });
      expect(result.isActive).toBe(true);
      expect(result.isInactive).toBe(false);
      expect(result.isSuspended).toBe(false);
      expect(result.isWaiting).toBe(false);
      expect(result.isRejected).toBe(false);
      expect(result.status).toBe('ACTIVE');
    });

    it('returns correct flags for WAITING status', () => {
      const result = getUserStatusInfo({ data: { status: 'WAITING' } });
      expect(result.isWaiting).toBe(true);
      expect(result.isActive).toBe(false);
    });

    it('returns correct flags for REJECT status', () => {
      const result = getUserStatusInfo({ data: { status: 'REJECT' } });
      expect(result.isRejected).toBe(true);
    });

    it('returns correct flags for SUSPENDED status', () => {
      const result = getUserStatusInfo({ data: { status: 'SUSPENDED' } });
      expect(result.isSuspended).toBe(true);
    });

    it('returns correct flags for INACTIVE status', () => {
      const result = getUserStatusInfo({ data: { status: 'INACTIVE' } });
      expect(result.isInactive).toBe(true);
    });

    it('returns correct flags for WAITING_FOR_SUPER_ADMIN', () => {
      const result = getUserStatusInfo({ data: { status: 'WAITING_FOR_SUPER_ADMIN' } });
      expect(result.isWaitingForSuperAdmin).toBe(true);
    });

    it('defaults to WAITING when userData is null/undefined', () => {
      const result = getUserStatusInfo(null);
      expect(result.status).toBe('WAITING');
      expect(result.isWaiting).toBe(true);
    });

    it('defaults to WAITING when status is missing', () => {
      const result = getUserStatusInfo({ data: {} });
      expect(result.status).toBe('WAITING');
    });
  });

  describe('getStatusConfig', () => {
    it('returns config for known status', () => {
      const config = getStatusConfig('ACTIVE');
      expect(config).toBeDefined();
      expect(config.value).toBe('ACTIVE');
    });

    it('falls back to WAITING config for unknown status', () => {
      const config = getStatusConfig('UNKNOWN_STATUS');
      expect(config.value).toBe('WAITING');
    });
  });

  describe('isValidStatusTransition', () => {
    it('allows WAITING → ACTIVE', () => {
      expect(isValidStatusTransition('WAITING', 'ACTIVE')).toBe(true);
    });

    it('allows WAITING → REJECT', () => {
      expect(isValidStatusTransition('WAITING', 'REJECT')).toBe(true);
    });

    it('allows ACTIVE → INACTIVE', () => {
      expect(isValidStatusTransition('ACTIVE', 'INACTIVE')).toBe(true);
    });

    it('disallows self-transitions', () => {
      expect(isValidStatusTransition('ACTIVE', 'ACTIVE')).toBe(false);
      expect(isValidStatusTransition('WAITING', 'WAITING')).toBe(false);
    });

    it('disallows WAITING → SUSPENDED', () => {
      expect(isValidStatusTransition('WAITING', 'SUSPENDED')).toBe(false);
    });

    it('returns false for unknown current status', () => {
      expect(isValidStatusTransition('UNKNOWN', 'ACTIVE')).toBe(false);
    });

    it('allows REJECT → ACTIVE', () => {
      expect(isValidStatusTransition('REJECT', 'ACTIVE')).toBe(true);
    });

    it('allows INACTIVE → ACTIVE', () => {
      expect(isValidStatusTransition('INACTIVE', 'ACTIVE')).toBe(true);
    });

    it('allows WAITING_FOR_SUPER_ADMIN → ACTIVE', () => {
      expect(isValidStatusTransition('WAITING_FOR_SUPER_ADMIN', 'ACTIVE')).toBe(true);
    });
  });

  describe('getAvailableStatusTransitions', () => {
    it('returns transitions for WAITING', () => {
      const transitions = getAvailableStatusTransitions('WAITING');
      expect(transitions).toContain('ACTIVE');
      expect(transitions).toContain('REJECT');
      expect(transitions).toContain('INACTIVE');
      expect(transitions).toContain('WAITING_FOR_SUPER_ADMIN');
    });

    it('returns transitions for ACTIVE', () => {
      const transitions = getAvailableStatusTransitions('ACTIVE');
      expect(transitions).toContain('REJECT');
      expect(transitions).toContain('INACTIVE');
      expect(transitions).not.toContain('ACTIVE');
    });

    it('returns empty array for unknown status', () => {
      expect(getAvailableStatusTransitions('UNKNOWN')).toEqual([]);
    });
  });

  describe('getRouteProtection', () => {
    it('returns ACTIVE-only for manage-products', () => {
      const config = getRouteProtection('manage-products');
      expect(config.allowedStatuses).toEqual(['ACTIVE']);
    });

    it('returns multiple statuses for my-settings', () => {
      const config = getRouteProtection('my-settings');
      expect(config.allowedStatuses).toContain('ACTIVE');
      expect(config.allowedStatuses).toContain('WAITING');
    });

    it('defaults to ACTIVE-only for unknown routes', () => {
      const config = getRouteProtection('unknown-route');
      expect(config.allowedStatuses).toEqual(['ACTIVE']);
      expect(config.redirectTo).toBe('/home');
    });
  });

  describe('hasRouteAccess', () => {
    it('ACTIVE user can access manage-products', () => {
      expect(hasRouteAccess('ACTIVE', 'manage-products')).toBe(true);
    });

    it('WAITING user cannot access manage-products', () => {
      expect(hasRouteAccess('WAITING', 'manage-products')).toBe(false);
    });

    it('WAITING user can access my-settings', () => {
      expect(hasRouteAccess('WAITING', 'my-settings')).toBe(true);
    });

    it('ACTIVE user can access all routes', () => {
      expect(hasRouteAccess('ACTIVE', 'manage-products')).toBe(true);
      expect(hasRouteAccess('ACTIVE', 'my-settings')).toBe(true);
      expect(hasRouteAccess('ACTIVE', 'home')).toBe(true);
    });

    it('unknown route defaults to ACTIVE-only', () => {
      expect(hasRouteAccess('ACTIVE', 'some-new-route')).toBe(true);
      expect(hasRouteAccess('WAITING', 'some-new-route')).toBe(false);
    });
  });

  describe('hasLimitedAccess', () => {
    it('returns true for WAITING', () => {
      expect(hasLimitedAccess('WAITING')).toBe(true);
    });

    it('returns true for INACTIVE', () => {
      expect(hasLimitedAccess('INACTIVE')).toBe(true);
    });

    it('returns true for WAITING_FOR_SUPER_ADMIN', () => {
      expect(hasLimitedAccess('WAITING_FOR_SUPER_ADMIN')).toBe(true);
    });

    it('returns false for ACTIVE', () => {
      expect(hasLimitedAccess('ACTIVE')).toBe(false);
    });

    it('returns false for REJECT', () => {
      expect(hasLimitedAccess('REJECT')).toBe(false);
    });
  });

  describe('hasFullAccess', () => {
    it('returns true only for ACTIVE', () => {
      expect(hasFullAccess('ACTIVE')).toBe(true);
    });

    it('returns false for all other statuses', () => {
      expect(hasFullAccess('WAITING')).toBe(false);
      expect(hasFullAccess('INACTIVE')).toBe(false);
      expect(hasFullAccess('REJECT')).toBe(false);
      expect(hasFullAccess('SUSPENDED')).toBe(false);
    });
  });

  describe('getUnauthorizedRedirect', () => {
    it('redirects limited access users to /home', () => {
      expect(getUnauthorizedRedirect('WAITING')).toBe('/home');
      expect(getUnauthorizedRedirect('INACTIVE')).toBe('/home');
      expect(getUnauthorizedRedirect('WAITING_FOR_SUPER_ADMIN')).toBe('/home');
    });

    it('redirects unauthorized users to /login', () => {
      expect(getUnauthorizedRedirect('REJECT')).toBe('/login');
      expect(getUnauthorizedRedirect('UNKNOWN')).toBe('/login');
    });
  });
});
