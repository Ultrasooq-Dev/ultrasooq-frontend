"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useMyAccounts,
  useSwitchAccount,
} from "@/apis/queries/auth.queries";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_SUB_ACCOUNT_STATUS } from "@/utils/constants";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusDisplayBadge from "@/components/shared/StatusDisplayBadge";
import { CreateSubAccountDialog } from "@/components/modules/accounts/CreateSubAccountDialog";

export default function MyAccountsPage() {
  const t = useTranslations();
  const { langDir, setUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: accountsData, isLoading, refetch, error } = useMyAccounts();
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
      // Full page reload ensures server-side auth picks up the new token
      window.location.href = "/home";
    } catch (error: any) {
      toast({
        title: "Switch Failed",
        description:
          error?.response?.data?.message || "Failed to switch account",
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
      // Full page reload ensures server-side auth picks up the new token
      window.location.href = "/home";
    } catch (error: any) {
      toast({
        title: "Switch Failed",
        description:
          error?.response?.data?.message || "Failed to switch account",
        variant: "danger",
      });
    }
  };

  // Helper function to get status display info
  const getStatusInfo = (account: any) => {
    const status = account?.status || DEFAULT_SUB_ACCOUNT_STATUS;
    const statusNote = account?.statusNote;

    return {
      status,
      statusNote,
      isWaiting: status === "WAITING",
      isActive: status === "ACTIVE",
      isRejected: status === "REJECT",
      isInactive: status === "INACTIVE",
      isWaitingForSuperAdmin: status === "WAITING_FOR_SUPER_ADMIN",
    };
  };

  // Helper function to get status description
  const getStatusDescription = (status: string, statusNote?: string) => {
    switch (status) {
      case "WAITING":
        return "Your account is pending approval. You'll be notified once it's reviewed.";
      case "ACTIVE":
        return "Your account is active and you can use all features.";
      case "REJECT":
        if (statusNote) {
          return "Your account was rejected. Please see the admin note below for details.";
        }
        return "Your account was rejected. Please contact support for more information.";
      case "INACTIVE":
        if (statusNote) {
          return "Your account is temporarily inactive. Please see the admin note below for details.";
        }
        return "Your account is temporarily inactive. Please contact support to reactivate.";
      case "WAITING_FOR_SUPER_ADMIN":
        if (statusNote) {
          return `Your account has been escalated to super admin for review: ${statusNote}`;
        }
        return "Your account has been escalated to super admin for final review.";
      default:
        return "Account status information not available.";
    }
  };

  if (!mounted || isLoading) {
    return (
      <LoaderWithMessage
        {...{ message: "Loading your accounts...", className: "min-h-screen" } as any}
      />
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            {t("error_loading_accounts")}
          </h2>
          <p className="mb-4 text-muted-foreground">
            {error?.response?.data?.message || t("failed_to_load_accounts")}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            {t("try_again")}
          </Button>
        </div>
      </div>
    );
  }

  const { mainAccount, accountsByType, allAccounts } = accountsData?.data || {};
  let currentAccount =
    allAccounts?.find((acc) => acc.isCurrentAccount) || mainAccount;
  let accountType = t("main_account");

  // Find the current sub-account
  const activeSubAccount = allAccounts?.find((acc) => acc.isCurrentAccount);
  if (activeSubAccount) {
    currentAccount = activeSubAccount;
    accountType = t("sub_account");
  }

  // Filter out main account from sub-accounts display
  const subAccounts =
    allAccounts?.filter((account) => {
      // Don't include main account in sub-accounts
      // Note: Sub-accounts have userId that matches mainAccount.id, but they are different entities
      if (account.id === mainAccount?.id) {
        return false;
      }

      // Debug logging
      if (process.env.NODE_ENV === "development") {
      }

      return true;
    }) || [];

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            {t("my_accounts")}
          </h1>
          <p className="text-muted-foreground">{t("manage_your_business_accounts")}</p>
        </div>

        {/* Current Account Card */}
        {currentAccount && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t("current_account")}</span>
                <Badge variant="outline" className="text-sm">
                  {accountType}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("account_name")}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {currentAccount.accountName ||
                      ("firstName" in currentAccount &&
                      "lastName" in currentAccount
                        ? `${currentAccount.firstName} ${currentAccount.lastName}`
                        : t("account_name"))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("trade_role")}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {currentAccount.tradeRole}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("status")}
                  </p>
                  <StatusDisplayBadge
                    status={getStatusInfo(currentAccount).status}
                    size="sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("email")}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {"email" in currentAccount ? currentAccount.email : "N/A"}
                  </p>
                </div>
              </div>

              {/* Notification Counts for Current Account - Only show if there are notifications */}
              {(((currentAccount.tradeRole === "COMPANY" ||
                currentAccount.tradeRole === "FREELANCER") &&
                (("orders" in currentAccount ? currentAccount.orders : 0) ||
                  0) > 0) ||
                (("messages" in currentAccount ? currentAccount.messages : 0) ||
                  0) > 0) && (
                <div className="mt-4 rounded-lg border border-border bg-muted p-3">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t("notifications")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* Orders Count - Only for COMPANY and FREELANCER */}
                    {(currentAccount.tradeRole === "COMPANY" ||
                      currentAccount.tradeRole === "FREELANCER") &&
                      (("orders" in currentAccount
                        ? currentAccount.orders
                        : 0) || 0) > 0 && (
                        <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5">
                          <svg
                            className="h-4 w-4 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          <span className="text-xs font-semibold text-primary">
                            {t("new_orders")}:{" "}
                            {("orders" in currentAccount
                              ? currentAccount.orders
                              : 0) || 0}
                          </span>
                        </div>
                      )}

                    {/* Messages Count - For all account types */}
                    {(("messages" in currentAccount
                      ? currentAccount.messages
                      : 0) || 0) > 0 && (
                      <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5">
                        <svg
                          className="h-4 w-4 text-success"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span className="text-xs font-semibold text-success">
                          {t("new_messages")}:{" "}
                          {("messages" in currentAccount
                            ? currentAccount.messages
                            : 0) || 0}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Description */}
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm text-primary">
                  {getStatusDescription(
                    getStatusInfo(currentAccount).status,
                    getStatusInfo(currentAccount).statusNote,
                  )}
                </p>
                {/* Show Status Note if available */}
                {getStatusInfo(currentAccount).statusNote && (
                  <div className="mt-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <div className="flex items-start space-x-2">
                      <div className="shrink-0">
                        <svg
                          className="h-5 w-5 text-warning"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-warning">
                          {t("admin_note")}:
                        </h4>
                        <p className="mt-1 text-sm text-warning">
                          {getStatusInfo(currentAccount).statusNote}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              {t("all_accounts")} ({subAccounts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="company">
              {t("company")} (
              {accountsByType?.company?.filter(
                (acc) => acc.id !== mainAccount?.id,
              ).length || 0}
              )
            </TabsTrigger>
            <TabsTrigger value="freelancer">
              {t("freelancer")} (
              {accountsByType?.freelancer?.filter(
                (acc) => acc.id !== mainAccount?.id,
              ).length || 0}
              )
            </TabsTrigger>
            <TabsTrigger value="buyer">
              {t("buyer")} (
              {accountsByType?.buyer?.filter(
                (acc) => acc.id !== mainAccount?.id,
              ).length || 0}
              )
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Create Account Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary hover:bg-primary/90"
              >
                {t("create_new_account")}
              </Button>
            </div>

            {/* All Accounts Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Sub Accounts */}
              {subAccounts.map((account) => {
                const statusInfo = getStatusInfo(account);
                const isCompanyOrFreelancer =
                  account.tradeRole === "COMPANY" ||
                  account.tradeRole === "FREELANCER";
                return (
                  <Card
                    key={account.id}
                    className="transition-shadow hover:shadow-lg"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{account.accountName}</span>
                        <Badge variant="outline">{t("sub_account")}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("trade_role")}
                        </p>
                        <p className="font-semibold">{account.tradeRole}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("status")}
                        </p>
                        <StatusDisplayBadge
                          status={statusInfo.status}
                          size="sm"
                        />
                      </div>

                      {/* Notification Counts - Only show if there are notifications */}
                      {((isCompanyOrFreelancer && (account.orders || 0) > 0) ||
                        (account.messages || 0) > 0) && (
                        <div className="rounded-lg border border-border bg-muted p-3">
                          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            {t("notifications")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {/* Orders Count - Only for COMPANY and FREELANCER */}
                            {isCompanyOrFreelancer &&
                              (account.orders || 0) > 0 && (
                                <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5">
                                  <svg
                                    className="h-4 w-4 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                  </svg>
                                  <span className="text-xs font-semibold text-primary">
                                    {t("new_orders")}: {account.orders || 0}
                                  </span>
                                </div>
                              )}

                            {/* Messages Count - For all account types */}
                            {(account.messages || 0) > 0 && (
                              <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5">
                                <svg
                                  className="h-4 w-4 text-success"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                <span className="text-xs font-semibold text-success">
                                  {t("new_messages")}: {account.messages || 0}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Show Status Note prominently for rejected/inactive accounts */}
                      {statusInfo.statusNote &&
                        (statusInfo.status === "REJECT" ||
                          statusInfo.status === "INACTIVE") && (
                          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                            <div className="flex items-start space-x-2">
                              <div className="shrink-0">
                                <svg
                                  className="mt-0.5 h-4 w-4 text-destructive"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-xs font-medium text-destructive">
                                  {t("admin_note")}:
                                </h4>
                                <p className="mt-1 text-xs text-destructive">
                                  {statusInfo.statusNote}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      {account.companyName && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t("company")}
                          </p>
                          <p className="font-semibold">{account.companyName}</p>
                        </div>
                      )}
                      {/* <div>
                        <p className="text-sm font-medium text-muted-foreground">Created</p>
                        <p className="font-semibold">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </p>
                      </div> */}
                      {!account.isCurrentAccount && (
                        <Button
                          onClick={() => handleSwitchAccount(account.id)}
                          variant="outline"
                          className="w-full"
                        >
                          {t("switch_to_this_account")}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {accountsByType?.company
                ?.filter((acc) => acc.id !== mainAccount?.id)
                .map((account) => {
                  const statusInfo = getStatusInfo(account);
                  return (
                    <Card
                      key={account.id}
                      className="transition-shadow hover:shadow-lg"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{account.accountName}</span>
                          <Badge variant="outline">{t("company")}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Status
                          </p>
                          <StatusDisplayBadge
                            status={statusInfo.status}
                            statusNote={statusInfo.statusNote}
                            size="sm"
                          />
                        </div>

                        {/* Notification Counts - Only show if there are notifications */}
                        {((account.orders || 0) > 0 ||
                          (account.messages || 0) > 0) && (
                          <div className="rounded-lg border border-border bg-muted p-3">
                            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                              {t("notifications")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {/* Orders Count */}
                              {(account.orders || 0) > 0 && (
                                <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5">
                                  <svg
                                    className="h-4 w-4 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                  </svg>
                                  <span className="text-xs font-semibold text-primary">
                                    {t("new_orders")}: {account.orders || 0}
                                  </span>
                                </div>
                              )}

                              {/* Messages Count */}
                              {(account.messages || 0) > 0 && (
                                <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5">
                                  <svg
                                    className="h-4 w-4 text-success"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                  </svg>
                                  <span className="text-xs font-semibold text-success">
                                    {t("new_messages")}: {account.messages || 0}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Show Status Note prominently for rejected/inactive accounts */}
                        {statusInfo.statusNote &&
                          (statusInfo.status === "REJECT" ||
                            statusInfo.status === "INACTIVE") && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                              <div className="flex items-start space-x-2">
                                <div className="shrink-0">
                                  <svg
                                    className="mt-0.5 h-4 w-4 text-destructive"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xs font-medium text-destructive">
                                    {t("admin_note")}:
                                  </h4>
                                  <p className="mt-1 text-xs text-destructive">
                                    {statusInfo.statusNote}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        {account.companyName && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {t("company_name")}
                            </p>
                            <p className="font-semibold">
                              {account.companyName}
                            </p>
                          </div>
                        )}
                        {!account.isCurrentAccount && (
                          <Button
                            onClick={() => handleSwitchAccount(account.id)}
                            variant="outline"
                            className="w-full"
                          >
                            {t("switch_to_this_account")}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="freelancer" className="space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {accountsByType?.freelancer
                ?.filter((acc) => acc.id !== mainAccount?.id)
                .map((account) => {
                  const statusInfo = getStatusInfo(account);
                  return (
                    <Card
                      key={account.id}
                      className="transition-shadow hover:shadow-lg"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{account.accountName}</span>
                          <Badge variant="outline">{t("freelancer")}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Status
                          </p>
                          <StatusDisplayBadge
                            status={statusInfo.status}
                            statusNote={statusInfo.statusNote}
                            size="sm"
                          />
                        </div>

                        {/* Notification Counts - Only show if there are notifications */}
                        {((account.orders || 0) > 0 ||
                          (account.messages || 0) > 0) && (
                          <div className="rounded-lg border border-border bg-muted p-3">
                            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                              {t("notifications")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {/* Orders Count */}
                              {(account.orders || 0) > 0 && (
                                <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5">
                                  <svg
                                    className="h-4 w-4 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                  </svg>
                                  <span className="text-xs font-semibold text-primary">
                                    {t("new_orders")}: {account.orders || 0}
                                  </span>
                                </div>
                              )}

                              {/* Messages Count */}
                              {(account.messages || 0) > 0 && (
                                <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5">
                                  <svg
                                    className="h-4 w-4 text-success"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                  </svg>
                                  <span className="text-xs font-semibold text-success">
                                    {t("new_messages")}: {account.messages || 0}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Show Status Note prominently for rejected/inactive accounts */}
                        {statusInfo.statusNote &&
                          (statusInfo.status === "REJECT" ||
                            statusInfo.status === "INACTIVE") && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                              <div className="flex items-start space-x-2">
                                <div className="shrink-0">
                                  <svg
                                    className="mt-0.5 h-4 w-4 text-destructive"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xs font-medium text-destructive">
                                    {t("admin_note")}:
                                  </h4>
                                  <p className="mt-1 text-xs text-destructive">
                                    {statusInfo.statusNote}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        {!account.isCurrentAccount && (
                          <Button
                            onClick={() => handleSwitchAccount(account.id)}
                            variant="outline"
                            className="w-full"
                          >
                            {t("switch_to_this_account")}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="buyer" className="space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {accountsByType?.buyer
                ?.filter((acc) => acc.id !== mainAccount?.id)
                .map((account) => {
                  const statusInfo = getStatusInfo(account);
                  return (
                    <Card
                      key={account.id}
                      className="transition-shadow hover:shadow-lg"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{account.accountName}</span>
                          <Badge variant="outline">{t("buyer")}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t("status")}
                          </p>
                          <StatusDisplayBadge
                            status={statusInfo.status}
                            statusNote={statusInfo.statusNote}
                            size="sm"
                          />
                        </div>

                        {/* Notification Counts - Only Messages for Buyer */}
                        <div className="rounded-lg border border-border bg-muted p-3">
                          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            {t("notifications")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {/* Messages Count */}
                            <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5">
                              <svg
                                className="h-4 w-4 text-success"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                              <span className="text-xs font-semibold text-success">
                                {t("new_messages")}: {account.messages || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Show Status Note prominently for rejected/inactive accounts */}
                        {statusInfo.statusNote &&
                          (statusInfo.status === "REJECT" ||
                            statusInfo.status === "INACTIVE") && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                              <div className="flex items-start space-x-2">
                                <div className="shrink-0">
                                  <svg
                                    className="mt-0.5 h-4 w-4 text-destructive"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xs font-medium text-destructive">
                                    {t("admin_note")}:
                                  </h4>
                                  <p className="mt-1 text-xs text-destructive">
                                    {statusInfo.statusNote}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        {!account.isCurrentAccount && (
                          <Button
                            onClick={() => handleSwitchAccount(account.id)}
                            variant="outline"
                            className="w-full"
                          >
                            {t("switch_to_this_account")}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Account Modal */}
        <CreateSubAccountDialog
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onAccountCreated={async () => {
            await refetch();
          }}
        />
      </div>
    </div>
  );
}
