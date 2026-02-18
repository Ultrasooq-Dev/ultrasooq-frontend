"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMyAccounts, useSwitchAccount } from "@/apis/queries/auth.queries";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDownIcon, UserIcon, BuildingIcon, ShoppingBagIcon } from "lucide-react";

export default function AccountSwitcher() {
  const t = useTranslations();
  const { langDir, setUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const { data: accountsData, isLoading } = useMyAccounts();
  const switchAccount = useSwitchAccount();

  const handleSwitchAccount = async (userAccountId: number) => {
    try {
      const result = await switchAccount.mutateAsync({ userAccountId });
      // Update AuthContext user with the switched account data
      const account = result?.data?.account;
      if (account) {
        setUser({
          id: account.id,
          firstName: (account as any).firstName || "",
          lastName: (account as any).lastName || "",
          tradeRole: account.tradeRole || "",
        });
      }
      toast({
        title: "Account Switched",
        description: "Successfully switched to the selected account",
        variant: "success",
      });
      setIsOpen(false);
      // Full page reload ensures server-side auth picks up the new token
      window.location.href = "/home";
    } catch (error: any) {
      toast({
        title: "Switch Failed",
        description: error?.response?.data?.message || "Failed to switch account",
        variant: "danger",
      });
    }
  };

  const handleSwitchToMainAccount = async () => {
    try {
      const result = await switchAccount.mutateAsync({ userAccountId: 0 });
      // Update AuthContext user with the main account data
      const account = result?.data?.account;
      if (account) {
        setUser({
          id: account.id,
          firstName: (account as any).firstName || "",
          lastName: (account as any).lastName || "",
          tradeRole: account.tradeRole || "",
        });
      }
      toast({
        title: "Account Switched",
        description: "Successfully switched to main account",
        variant: "success",
      });
      setIsOpen(false);
      // Full page reload ensures server-side auth picks up the new token
      window.location.href = "/home";
    } catch (error: any) {
      toast({
        title: "Switch Failed",
        description: error?.response?.data?.message || "Failed to switch account",
        variant: "danger",
      });
    }
  };

  const handleManageAccounts = () => {
    setIsOpen(false);
    router.push("/my-accounts");
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  const mainAccount = accountsData?.data?.mainAccount;
  const currentAccount = accountsData?.data?.allAccounts?.find(
    (account: any) => account.isCurrentAccount
  );
  const allAccounts = accountsData?.data?.allAccounts || [];

  // Determine current account display
  const currentAccountDisplay = currentAccount || mainAccount;
  const isMainAccount = !currentAccount;

  // Filter other accounts (excluding current account)
  const otherAccounts = allAccounts.filter((account: any) => !account.isCurrentAccount);
  
  // Only show switch section if there are actually accounts to switch to
  // For main account: only if there are sub-accounts to switch to
  // For sub-account: if there are other sub-accounts OR can switch back to main
  const hasOtherSubAccounts = otherAccounts.length > 0;
  const canSwitchToMain = !isMainAccount && mainAccount;
  const hasAccountsToSwitchTo = hasOtherSubAccounts || canSwitchToMain;

  const getAccountIcon = (tradeRole: string) => {
    switch (tradeRole) {
      case "COMPANY":
        return <BuildingIcon className="h-4 w-4" />;
      case "BUYER":
        return <ShoppingBagIcon className="h-4 w-4" />;
      case "FREELANCER":
        return <UserIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {getAccountIcon(currentAccountDisplay?.tradeRole || 'BUYER')}
          <span className="hidden sm:inline">
            {currentAccountDisplay?.accountName || 
             `${currentAccountDisplay?.firstName || ''} ${currentAccountDisplay?.lastName || ''}`.trim() ||
             'Account'}
          </span>
          {isMainAccount && (
            <Badge variant="secondary" className="text-xs">
              Main
            </Badge>
          )}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Current Account</DropdownMenuLabel>
        <DropdownMenuItem disabled className="flex items-center gap-2">
          {getAccountIcon(currentAccountDisplay?.tradeRole || 'BUYER')}
          <div className="flex flex-col">
            <span className="font-medium">
              {currentAccountDisplay?.accountName || 
               `${currentAccountDisplay?.firstName || ''} ${currentAccountDisplay?.lastName || ''}`.trim() ||
               'Account'}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {currentAccountDisplay?.tradeRole?.toLowerCase() || 'buyer'}
            </span>
            {currentAccountDisplay?.companyName && (
              <span className="text-xs text-gray-400">
                {currentAccountDisplay.companyName}
              </span>
            )}
          </div>
        </DropdownMenuItem>
        
        {/* Only show Switch Account section if there are accounts to switch to */}
        {hasAccountsToSwitchTo && (
          <>
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
            
            {/* Main Account Option */}
            {!isMainAccount && mainAccount && (
              <DropdownMenuItem
                onClick={handleSwitchToMainAccount}
                disabled={switchAccount.isPending}
                className="flex items-center gap-2"
              >
                {getAccountIcon(mainAccount?.tradeRole || 'BUYER')}
                <div className="flex flex-col">
                  <span className="font-medium">
                    {`${mainAccount?.firstName || ''} ${mainAccount?.lastName || ''}`.trim() || 'Main Account'}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {mainAccount?.tradeRole?.toLowerCase() || 'buyer'} (Main)
                  </span>
                </div>
              </DropdownMenuItem>
            )}

            {/* Other Accounts */}
            {otherAccounts.map((account: any) => (
              <DropdownMenuItem
                key={account.id}
                onClick={() => handleSwitchAccount(account.id)}
                disabled={switchAccount.isPending}
                className="flex items-center gap-2"
              >
                {getAccountIcon(account.tradeRole)}
                <div className="flex flex-col">
                  <span className="font-medium">{account.accountName}</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {account.tradeRole.toLowerCase()}
                  </span>
                  {account.companyName && (
                    <span className="text-xs text-gray-400">
                      {account.companyName}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleManageAccounts}>
          Manage All Accounts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

