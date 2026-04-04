import { useQuery } from "@tanstack/react-query";
import { fetchUserById } from "@/apis/requests/user.requests";
import { useMemo, useState, useEffect } from "react";

interface UserAccount {
  id: number;
  firstName: string;
  lastName: string;
  accountName: string;
  email: string;
  phoneNumber: string;
  profilePicture: string | null;
  tradeRole: string;
  userProfile: any[];
}

export const useUserAccounts = (userIds: number[]) => {
  const [usersData, setUsersData] = useState<Map<number, UserAccount>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (userIds.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const userPromises = userIds.map(async (userId) => {
          try {
            const response = await fetchUserById({ userId });
            if (response.data?.data) {
              const userData = response.data.data;
              return {
                userId,
                data: {
                  id: userId,
                  firstName: userData.firstName || "",
                  lastName: userData.lastName || "",
                  accountName: userData.accountName || `Account ${userId}`,
                  email: userData.email || "",
                  phoneNumber: userData.phoneNumber || "",
                  profilePicture: userData.profilePicture || null,
                  tradeRole: userData.tradeRole || "VENDOR",
                  userProfile: userData.userProfile || [],
                },
              };
            }
            return null;
          } catch (err) {
            return {
              userId,
              data: {
                id: userId,
                firstName: `Account`,
                lastName: `${userId}`,
                accountName: `Account ${userId}`,
                email: `account${userId}@example.com`,
                phoneNumber: "",
                profilePicture: null,
                tradeRole: "VENDOR",
                userProfile: [],
              },
            };
          }
        });

        const results = await Promise.all(userPromises);
        const newUsersMap = new Map<number, UserAccount>();

        results.forEach((result) => {
          if (result) {
            newUsersMap.set(result.userId, result.data);
          }
        });

        setUsersData(newUsersMap);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [userIds]);

  return {
    usersMap: usersData,
    isLoading,
    error,
  };
};
