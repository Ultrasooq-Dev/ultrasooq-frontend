import { getCookie } from "cookies-next";
import {
  ULTRASOOQ_TOKEN_KEY,
  USER_STATUS_CONFIG,
  DEFAULT_SUB_ACCOUNT_STATUS,
} from "@/utils/constants";

export interface UserStatus {
  isActive: boolean;
  isInactive: boolean;
  isSuspended: boolean;
  isWaiting: boolean;
  isRejected: boolean;
  isWaitingForSuperAdmin: boolean;
  status: string;
}

/**
 * Check if a user has an allowed status
 * @param userStatus - The user's current status
 * @param allowedStatuses - Array of allowed statuses
 * @returns boolean indicating if access is allowed
 */
export const isStatusAllowed = (
  userStatus: string,
  allowedStatuses: string[],
): boolean => {
  return allowedStatuses.includes(userStatus);
};

/**
 * Get user status information from the current user data
 * @param userData - User data from API response
 * @returns UserStatus object with boolean flags
 */
export const getUserStatusInfo = (userData: any): UserStatus => {
  const status = userData?.data?.status || DEFAULT_SUB_ACCOUNT_STATUS;

  return {
    isActive: status === "ACTIVE",
    isInactive: status === "INACTIVE",
    isSuspended: status === "SUSPENDED",
    isWaiting: status === "WAITING",
    isRejected: status === "REJECT",
    isWaitingForSuperAdmin: status === "WAITING_FOR_SUPER_ADMIN",
    status,
  };
};

/**
 * Check if user is authenticated (has token)
 * @returns boolean indicating if user has access token
 */
export const isAuthenticated = (): boolean => {
  return !!getCookie(ULTRASOOQ_TOKEN_KEY);
};

/**
 * Get status display information
 * @param status - User status
 * @returns Status configuration object
 */
export const getStatusConfig = (status: string) => {
  return (
    USER_STATUS_CONFIG[status as keyof typeof USER_STATUS_CONFIG] ||
    USER_STATUS_CONFIG.WAITING
  );
};

/**
 * Check if status transition is valid
 * @param currentStatus - Current user status
 * @param newStatus - New status to transition to
 * @returns boolean indicating if transition is valid
 */
export const isValidStatusTransition = (
  currentStatus: string,
  newStatus: string,
): boolean => {
  const validTransitions: Record<string, string[]> = {
    WAITING: ["ACTIVE", "REJECT", "INACTIVE", "WAITING_FOR_SUPER_ADMIN"],
    ACTIVE: ["REJECT", "INACTIVE", "WAITING_FOR_SUPER_ADMIN"],
    REJECT: ["ACTIVE", "INACTIVE", "WAITING_FOR_SUPER_ADMIN"],
    INACTIVE: ["ACTIVE", "REJECT", "WAITING_FOR_SUPER_ADMIN"],
    WAITING_FOR_SUPER_ADMIN: ["ACTIVE", "REJECT", "INACTIVE"],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Get available status transitions for a user
 * @param currentStatus - Current user status
 * @returns Array of available status transitions
 */
export const getAvailableStatusTransitions = (
  currentStatus: string,
): string[] => {
  const validTransitions: Record<string, string[]> = {
    WAITING: ["ACTIVE", "REJECT", "INACTIVE", "WAITING_FOR_SUPER_ADMIN"],
    ACTIVE: ["REJECT", "INACTIVE", "WAITING_FOR_SUPER_ADMIN"],
    REJECT: ["ACTIVE", "INACTIVE", "WAITING_FOR_SUPER_ADMIN"],
    INACTIVE: ["ACTIVE", "REJECT", "WAITING_FOR_SUPER_ADMIN"],
    WAITING_FOR_SUPER_ADMIN: ["ACTIVE", "REJECT", "INACTIVE"],
  };

  return validTransitions[currentStatus] || [];
};

/**
 * Get protected route configuration
 * @param routeName - Name of the route
 * @returns Route protection configuration
 */
export const getRouteProtection = (routeName: string) => {
  const routeConfig: Record<
    string,
    { allowedStatuses: string[]; redirectTo: string }
  > = {
    // Full access routes - only for ACTIVE users
    "manage-products": { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },
    "manage-services": { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },
    "team-members": { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },
    "seller-orders": { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },
    "rfq-quotes": { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },
    "seller-rfq-request": {
      allowedStatuses: ["ACTIVE"],
      redirectTo: "/home",
    },
    "seller-rewards": { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },
    "share-links": { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },
    transactions: { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },
    queries: { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },
    "vendor-dashboard": { allowedStatuses: ["ACTIVE"], redirectTo: "/home" },

    // Limited access routes - for ACTIVE, WAITING, INACTIVE, and WAITING_FOR_SUPER_ADMIN users
    "my-settings": {
      allowedStatuses: [
        "ACTIVE",
        "WAITING",
        "INACTIVE",
        "WAITING_FOR_SUPER_ADMIN",
      ],
      redirectTo: "/home",
    },
    profile: {
      allowedStatuses: [
        "ACTIVE",
        "WAITING",
        "INACTIVE",
        "WAITING_FOR_SUPER_ADMIN",
      ],
      redirectTo: "/home",
    },
    "my-accounts": {
      allowedStatuses: [
        "ACTIVE",
        "WAITING",
        "INACTIVE",
        "WAITING_FOR_SUPER_ADMIN",
      ],
      redirectTo: "/home",
    },

    // Basic access routes - for all authenticated users
    home: {
      allowedStatuses: [
        "ACTIVE",
        "WAITING",
        "INACTIVE",
        "WAITING_FOR_SUPER_ADMIN",
      ],
      redirectTo: "/login",
    },
    logout: {
      allowedStatuses: [
        "ACTIVE",
        "WAITING",
        "INACTIVE",
        "WAITING_FOR_SUPER_ADMIN",
      ],
      redirectTo: "/login",
    },
  };

  return (
    routeConfig[routeName] || {
      allowedStatuses: ["ACTIVE"],
      redirectTo: "/home",
    }
  );
};

/**
 * Check if user has access to a specific route based on their status
 * @param userStatus - Current user status
 * @param routeName - Name of the route to check
 * @returns boolean indicating if access is allowed
 */
export const hasRouteAccess = (
  userStatus: string,
  routeName: string,
): boolean => {
  const routeProtection = getRouteProtection(routeName);
  return routeProtection.allowedStatuses.includes(userStatus);
};

/**
 * Check if user has limited access (only profile and logout)
 * @param userStatus - Current user status
 * @returns boolean indicating if user has limited access
 */
export const hasLimitedAccess = (userStatus: string): boolean => {
  return ["WAITING", "INACTIVE", "WAITING_FOR_SUPER_ADMIN"].includes(
    userStatus,
  );
};

/**
 * Check if user has full access to the system
 * @param userStatus - Current user status
 * @returns boolean indicating if user has full access
 */
export const hasFullAccess = (userStatus: string): boolean => {
  return userStatus === "ACTIVE";
};

/**
 * Get redirect URL for unauthorized access
 * @param userStatus - Current user status
 * @returns string with appropriate redirect URL
 */
export const getUnauthorizedRedirect = (userStatus: string): string => {
  if (hasLimitedAccess(userStatus)) {
    return "/home"; // Redirect to home page for limited access users
  }
  return "/login"; // Redirect to login for completely unauthorized users
};
