import { useMemo } from "react";
import { useMe } from "@/apis/queries/user.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import {
  hasRouteAccess,
  hasLimitedAccess,
  hasFullAccess,
  getStatusConfig,
} from "@/utils/statusCheck";

export const useAccessControl = () => {
  const { data: me } = useMe();
  const { data: currentAccount } = useCurrentAccount();

  const userStatus = useMemo(() => {
    if (currentAccount?.data?.account?.status) {
      return currentAccount.data.account.status;
    }
    if (me?.data?.data?.status) {
      return me.data.data.status;
    }
    return "WAITING"; // Default fallback
  }, [currentAccount, me?.data?.data]);

  const statusConfig = useMemo(() => {
    return getStatusConfig(userStatus);
  }, [userStatus]);

  const accessControl = useMemo(() => {
    return {
      // Status checks
      isActive: userStatus === "ACTIVE",
      isWaiting: userStatus === "WAITING",
      isInactive: userStatus === "INACTIVE",
      isRejected: userStatus === "REJECT",

      // Access level checks
      hasFullAccess: hasFullAccess(userStatus),
      hasLimitedAccess: hasLimitedAccess(userStatus),

      // Route access checks
      canAccessRoute: (routeName: string) =>
        hasRouteAccess(userStatus, routeName),

      // Feature access checks
      canManageProducts: userStatus === "ACTIVE",
      canManageServices: userStatus === "ACTIVE",
      canAccessOrders: userStatus === "ACTIVE",
      canAccessRFQ: userStatus === "ACTIVE",
      canAccessDashboard: userStatus === "ACTIVE",
      canAccessTransactions: userStatus === "ACTIVE",
      canAccessQueries: userStatus === "ACTIVE",
      canAccessTeamMembers: userStatus === "ACTIVE",
      canAccessShareLinks: userStatus === "ACTIVE",
      canAccessSellerRewards: userStatus === "ACTIVE",

      // Profile and settings access
      canAccessProfile: ["ACTIVE", "WAITING", "INACTIVE"].includes(userStatus),
      canAccessSettings: ["ACTIVE", "WAITING", "INACTIVE"].includes(userStatus),
      canAccessAccounts: ["ACTIVE", "WAITING", "INACTIVE"].includes(userStatus),

      // Status-specific actions
      canCreateSubAccounts: userStatus === "ACTIVE",
      canSwitchAccounts: userStatus === "ACTIVE",
      canEditProfile: ["ACTIVE", "WAITING", "INACTIVE"].includes(userStatus),

      // Current user info
      userStatus,
      statusConfig,
      currentAccount: currentAccount?.data?.account,
      isMainAccount: currentAccount?.data?.isMainAccount,
    };
  }, [userStatus, statusConfig, currentAccount]);

  return accessControl;
};
