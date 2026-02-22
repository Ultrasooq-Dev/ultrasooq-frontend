"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useWalletBalance, useWalletTransactions } from "@/apis/queries/wallet.queries";
import { useWalletStore } from "@/lib/walletStore";
import WalletBalanceCard from "@/components/modules/wallet/WalletBalanceCard";
import WalletActions from "@/components/modules/wallet/WalletActions";
import TransactionHistory from "@/components/modules/wallet/TransactionHistory";
import WalletSettings from "@/components/modules/wallet/WalletSettings";
import { checkPermission } from "@/helpers/permission";

const WalletPage = () => {
  const t = useTranslations();
  const { user, langDir } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [page, setPage] = useState(1);
  const limit = 10;

  const hasPermission = !!user;

  const { data: walletData, isLoading: walletLoading, error: walletError } = useWalletBalance(hasPermission);
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions({
    page,
    limit,
  }, hasPermission);

  const { setWallet, setTransactions } = useWalletStore();

  useEffect(() => {
    if (walletData?.data) {
      setWallet(walletData.data);
    }
  }, [walletData, setWallet]);

  useEffect(() => {
    if (transactionsData?.data?.data) {
      setTransactions(transactionsData.data.data);
    }
  }, [transactionsData, setTransactions]);

  if (!user) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="max-w-md w-full bg-card rounded-lg shadow-sm border border-border p-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">{t("access_denied")}</h2>
          <p className="text-muted-foreground mb-6">{t("please_login_to_access_wallet")}</p>
          <button 
            className="w-full bg-[#FF9900] hover:bg-[#FF8800] text-white font-medium py-2.5 px-4 rounded-md transition-colors"
            onClick={() => router.push("/login")}
          >
            {t("login")}
          </button>
        </div>
      </div>
    );
  }

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
            <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-5 bg-muted rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
                <div className="h-10 bg-muted rounded w-40 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (walletError) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="max-w-md w-full bg-card rounded-lg shadow-sm border border-border p-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">{t("error_loading_wallet")}</h2>
          <p className="text-muted-foreground mb-6">{t("unable_to_load_wallet_data")}</p>
          <button 
            className="w-full bg-[#FF9900] hover:bg-[#FF8800] text-white font-medium py-2.5 px-4 rounded-md transition-colors"
            onClick={() => window.location.reload()}
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  const availableBalance = (walletData?.data?.balance || 0) - (walletData?.data?.frozenBalance || 0);

  return (
    <div className="min-h-screen bg-muted">
      {/* Header Section - Amazon Style */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground" dir={langDir} translate="no">
              {t("my_wallet")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1" dir={langDir} translate="no">
              {t("manage_your_funds_and_transactions")}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Balance Overview Cards - Amazon Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow-sm border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground" dir={langDir} translate="no">
                {t("available_balance")}
              </span>
              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold text-success">
              {Number(availableBalance).toFixed(2)}
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground" dir={langDir} translate="no">
                {t("frozen_balance")}
              </span>
              <div className="w-10 h-10 bg-warning/5 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold text-warning">
              {walletData?.data?.frozenBalance ? Number(walletData.data.frozenBalance).toFixed(2) : "0.00"}
            </div>
          </div>
        </div>

        {/* Wallet Actions */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
          <WalletActions wallet={walletData?.data} />
        </div>

        {/* Main Content Area */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          {/* Tabs - Amazon Style */}
          <div className="border-b border-border">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "overview"
                    ? "border-[#FF9900] text-[#FF9900]"
                    : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border"
                }`}
                dir={langDir}
                translate="no"
              >
                {t("overview")}
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "transactions"
                    ? "border-[#FF9900] text-[#FF9900]"
                    : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border"
                }`}
                dir={langDir}
                translate="no"
              >
                {t("transactions")}
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "settings"
                    ? "border-[#FF9900] text-[#FF9900]"
                    : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border"
                }`}
                dir={langDir}
                translate="no"
              >
                {t("settings")}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
                    {t("recent_activity")}
                  </h2>
                  <TransactionHistory
                    transactions={transactionsData?.data?.data?.slice(0, 5) || []}
                    loading={transactionsLoading}
                  />
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                <TransactionHistory
                  transactions={transactionsData?.data?.data || []}
                  loading={transactionsLoading}
                  pagination={{
                    page,
                    setPage,
                    total: transactionsData?.data?.total || 0,
                    limit,
                  }}
                />
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <WalletSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
