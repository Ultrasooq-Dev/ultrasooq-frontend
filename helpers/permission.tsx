import { useAuth } from "@/context/AuthContext"

export const PERMISSION_DASHBOARD = "Dashboard";
export const PERMISSION_TEAM_MEMBERS = "Team Member";
export const PERMISSION_PRODUCTS = "Product";
export const PERMISSION_SERVICES = "Service";
export const PERMISSION_ORDERS = "Order";
export const PERMISSION_RFQ_QUOTES = "RFQ Quotes";
export const PERMISSION_RFQ_SELLER_REQUESTS = "RFQ Seller Requests";
export const PERMISSION_SELLER_REWARDS = "Seller Reward";
export const PERMISSION_SHARE_LINKS = "Shared Link";
export const PERMISSION_MESSAGE_SYSTEM = "Message System";

export const checkPermission = (permissionName: string): boolean => {
    const { user, permissions } = useAuth();

    if (user?.tradeRole != 'MEMBER') return true;

    if (user?.tradeRole == 'MEMBER' && !permissions.find((permission: any) => permission.permissionDetail?.name == permissionName)) {
        return false;
    }

    return true;
}

export const getPermissions = (): string[] => {
    const { user, permissions } = useAuth();

    return permissions
        .filter((permission: any) => permission.permissionDetail)
        .map((permission: any) => permission.permissionDetail.name);
};