"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/apis/queries/user.queries';
import { useCurrentAccount } from '@/apis/queries/auth.queries';
import {
  hasRouteAccess,
  hasLimitedAccess,
  getUnauthorizedRedirect,
  hasFullAccess
} from '@/utils/statusCheck';
import { ULTRASOOQ_TOKEN_KEY } from '@/utils/constants';
import { getCookie } from 'cookies-next';
import LoaderWithMessage from './LoaderWithMessage';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredStatus?: 'ACTIVE' | 'WAITING' | 'INACTIVE' | 'ANY';
  fallback?: React.ReactNode;
  showLoader?: boolean;
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredStatus = 'ACTIVE',
  fallback,
  showLoader = true,
}) => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const { data: me, isLoading: meLoading, isError: meError } = useMe(!!accessToken);
  const { data: currentAccount, isLoading: accountLoading, isError: accountError } = useCurrentAccount();

  useEffect(() => {
    if (!accessToken) {
      // No token, redirect to login
      router.push('/login');
      return;
    }

    if (meLoading || accountLoading) {
      return; // Still loading
    }

    // If both queries errored (e.g. network issue), grant temporary access
    // instead of falsely redirecting - the user will be redirected on next
    // successful fetch if their status is wrong
    if (meError && accountError) {
      setHasAccess(true);
      setIsChecking(false);
      return;
    }

    // Prevent redirect if we don't have account data yet
    // Give it some time before assuming there's no data
    if (!currentAccount?.data?.account && !me?.data?.data) {
      // Set a timeout to grant access after 5 seconds of no data
      // This prevents infinite loading when API is down
      if (!checkTimeoutRef.current) {
        checkTimeoutRef.current = setTimeout(() => {
          setHasAccess(true);
          setIsChecking(false);
        }, 5000);
      }
      return;
    }

    // Clear timeout if we got data
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }

    // Get user status from current account or me data
    // Default to 'ACTIVE' to prevent false redirects when data is partially available
    let userStatus = 'ACTIVE';

    if (currentAccount?.data?.account?.status) {
      userStatus = currentAccount.data.account.status;
    } else if (me?.data?.data?.status) {
      userStatus = me.data.data.status;
    }

    // Check if user has access based on status
    let accessGranted = false;

    if (requiredStatus === 'ANY') {
      accessGranted = true; // Allow access for any status
    } else if (requiredStatus === 'ACTIVE') {
      accessGranted = hasFullAccess(userStatus);
    } else if (requiredStatus === 'WAITING' || requiredStatus === 'INACTIVE') {
      accessGranted = hasLimitedAccess(userStatus) || hasFullAccess(userStatus);
    }

    if (!accessGranted) {
      // User doesn't have access, redirect appropriately
      const redirectUrl = getUnauthorizedRedirect(userStatus);

      // Prevent infinite redirects - if we're already on the redirect URL, don't redirect again
      if (typeof window !== 'undefined' && window.location.pathname === redirectUrl) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      router.push(redirectUrl);
      return;
    }

    setHasAccess(true);
    setIsChecking(false);
  }, [accessToken, me, currentAccount, meLoading, accountLoading, meError, accountError, requiredStatus, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  if (meLoading || accountLoading || isChecking) {
    return showLoader ? (
      <LoaderWithMessage message="Checking access..." />
    ) : null;
  }

  if (!hasAccess) {
    return fallback || null;
  }

  return <>{children}</>;
};

export default RouteGuard;
