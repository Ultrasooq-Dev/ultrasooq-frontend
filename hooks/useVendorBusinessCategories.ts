import { useMemo } from "react";
import { useUniqueUser, useUserBusinessCategories } from "@/apis/queries/user.queries";
import { useAuth } from "@/context/AuthContext";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";

/**
 * Hook to get vendor's business category IDs
 * Returns empty array if user is not a vendor or has no business categories
 * Uses current account's user ID for multi-account support
 * Tries multiple methods: useUserBusinessCategories (token-based) and useUniqueUser (userId-based)
 */
export const useVendorBusinessCategories = () => {
  const { user } = useAuth();
  const currentAccount = useCurrentAccount();
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  
  // Method 1: Try useUserBusinessCategories (token-based, should work with current account)
  const userBusinessCategoriesQuery = useUserBusinessCategories(!!accessToken);
  
  // Method 2: Try useUniqueUser with account/user ID
  // Get the user ID from current account (for subaccounts) or fallback to main user
  const account = currentAccount?.data?.data?.account;
  const userId = (account as any)?.userId
    ? Number((account as any).userId)
    : (account?.id && !currentAccount?.data?.data?.isMainAccount)
      ? Number(account.id) // For sub-accounts, use account id if userId is not available
      : (user?.id ? Number(user.id) : undefined);
  
  const uniqueUser = useUniqueUser(
    { userId },
    !!userId
  );

  const businessCategoryIds = useMemo(() => {
    // Try Method 1 first: useUserBusinessCategories (token-based)
    if (userBusinessCategoriesQuery?.data?.data) {
      const categories = userBusinessCategoriesQuery.data.data;
      // Backend now returns an array of UserBusinessCategory objects with categoryId
      // Extract category IDs from the response
      const categoryIds = Array.isArray(categories)
        ? categories.map((cat: any) => cat.categoryId || cat.id).filter(Boolean)
        : [];
      if (categoryIds.length > 0) {
        return categoryIds;
      }
    }

    // Fallback to Method 2: useUniqueUser
    if (!uniqueUser?.data?.data?.userBusinesCategoryDetail) {
      return [];
    }

    const categoryIds = uniqueUser.data.data.userBusinesCategoryDetail.map(
      (category: any) => category.categoryId
    );

    return categoryIds;
  }, [
    userBusinessCategoriesQuery?.data?.data,
    uniqueUser?.data?.data?.userBusinesCategoryDetail
  ]);

  return businessCategoryIds;
};
