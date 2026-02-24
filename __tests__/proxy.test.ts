/**
 * Tests for Next.js proxy (proxy.ts)
 *
 * The proxy handles:
 * - Root redirect: / -> /home
 * - Auth pages: redirect to /home if already logged in
 * - Protected pages: redirect to /login if not authenticated
 * - Public pages: allow access without authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { PUREMOON_TOKEN_KEY } from '@/utils/constants';

// Mock next/server
jest.mock('next/server', () => {
  const redirect = jest.fn((url: URL) => ({
    type: 'redirect',
    url: url.toString(),
    headers: new Map(),
  }));

  const next = jest.fn(() => ({
    type: 'next',
    headers: new Map(),
  }));

  return {
    NextResponse: {
      redirect: redirect,
      next: next,
    },
    NextRequest: jest.fn(),
  };
});

jest.mock('@/utils/constants', () => ({
  PUREMOON_TOKEN_KEY: 'puremoon_accessToken',
}));

// Import proxy after mocking
import { proxy } from '@/proxy';

/**
 * Helper to create a mock NextRequest object.
 */
function createMockRequest(
  pathname: string,
  authToken?: string
): NextRequest {
  const url = new URL(`http://localhost:4001${pathname}`);

  const cookies = {
    get: jest.fn((name: string) => {
      if (name === PUREMOON_TOKEN_KEY && authToken) {
        return { name, value: authToken };
      }
      return undefined;
    }),
    getAll: jest.fn(() => []),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn((name: string) => name === PUREMOON_TOKEN_KEY && !!authToken),
    clear: jest.fn(),
    size: 0,
    [Symbol.iterator]: function* () {},
  };

  const nextUrl = {
    pathname,
    search: '',
    searchParams: new URLSearchParams(),
    hash: '',
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    basePath: '',
    locale: '',
    defaultLocale: '',
    clone: jest.fn(),
  };

  return {
    cookies,
    nextUrl,
    url: url.toString(),
    method: 'GET',
    headers: new Headers(),
    geo: {},
    ip: '127.0.0.1',
  } as unknown as NextRequest;
}

describe('Proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Root Redirect', () => {
    it('should redirect / to /home', () => {
      const request = createMockRequest('/');

      proxy(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/home',
        })
      );
    });
  });

  describe('Public Pages', () => {
    it('should allow access to public pages without auth', () => {
      const publicPaths = ['/home', '/products', '/services', '/about', '/contact'];

      publicPaths.forEach((path) => {
        jest.clearAllMocks();
        const request = createMockRequest(path);
        proxy(request);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      });
    });

    it('should allow access to public pages with auth', () => {
      const request = createMockRequest('/home', 'valid-token-123');

      proxy(request);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Protected Pages', () => {
    it('should redirect unauthenticated users from protected pages', () => {
      const protectedPaths = [
        '/profile',
        '/my-settings',
        '/my-accounts',
        '/my-orders',
        '/checkout',
        '/notifications',
        '/wallet',
        '/wishlist',
        '/manage-products',
        '/vendor-dashboard',
      ];

      protectedPaths.forEach((path) => {
        jest.clearAllMocks();
        const request = createMockRequest(path);
        proxy(request);

        expect(NextResponse.redirect).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/login',
          })
        );
      });
    });

    it('should redirect unauthenticated users from nested protected paths', () => {
      const request = createMockRequest('/profile/settings');

      proxy(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/login',
        })
      );
    });

    it('should allow authenticated users to access protected pages', () => {
      const request = createMockRequest('/profile', 'valid-token-xyz');

      proxy(request);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe('Auth Pages', () => {
    it('should redirect authenticated users from auth pages', () => {
      const authPages = [
        '/login',
        '/register',
        '/forget-password',
        '/reset-password',
        '/password-reset-verify',
        '/otp-verify',
      ];

      authPages.forEach((path) => {
        jest.clearAllMocks();
        const request = createMockRequest(path, 'existing-token-abc');
        proxy(request);

        expect(NextResponse.redirect).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/home',
          })
        );
      });
    });

    it('should allow unauthenticated users to access auth pages', () => {
      const authPages = ['/login', '/register', '/forget-password'];

      authPages.forEach((path) => {
        jest.clearAllMocks();
        const request = createMockRequest(path);
        proxy(request);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      });
    });
  });
});
