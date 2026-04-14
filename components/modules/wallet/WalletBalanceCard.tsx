"use client";
import React from "react";
import { IWallet } from "@/utils/types/wallet.types";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

interface WalletBalanceCardProps {
  wallet: IWallet | null;
  loading?: boolean;
}

const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({ wallet, loading = false }) => {
  const { currency } = useAuth();
  const t = useTranslations();

  if (loading) {
    return (
      <div className="rounded-xl bg-[var(--brand-dark)] p-6 text-[var(--card)] shadow-[0_4px_20px_rgba(2,35,53,0.1)] border border-border mb-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[1.4rem] font-semibold m-0">{t("wallet_balance")}</h3>
          <div className="h-4 w-[60%] rounded bg-gradient-to-r from-muted via-muted-foreground/30 to-muted bg-[length:200%_100%] animate-[loading_1.5s_infinite] mb-2"></div>
        </div>
        <div className="text-center mb-5">
          <div className="h-6 w-[40%] mx-auto rounded bg-gradient-to-r from-muted via-muted-foreground/30 to-muted bg-[length:200%_100%] animate-[loading_1.5s_infinite]"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-white/10 border border-white/10 p-4 text-center">
            <div className="h-4 w-[60%] mx-auto rounded bg-gradient-to-r from-muted via-muted-foreground/30 to-muted bg-[length:200%_100%] animate-[loading_1.5s_infinite] mb-2"></div>
            <div className="h-4 w-[60%] mx-auto rounded bg-gradient-to-r from-muted via-muted-foreground/30 to-muted bg-[length:200%_100%] animate-[loading_1.5s_infinite] mb-2"></div>
          </div>
          <div className="rounded-lg bg-white/10 border border-white/10 p-4 text-center">
            <div className="h-4 w-[60%] mx-auto rounded bg-gradient-to-r from-muted via-muted-foreground/30 to-muted bg-[length:200%_100%] animate-[loading_1.5s_infinite] mb-2"></div>
            <div className="h-4 w-[60%] mx-auto rounded bg-gradient-to-r from-muted via-muted-foreground/30 to-muted bg-[length:200%_100%] animate-[loading_1.5s_infinite] mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  const availableBalance = (wallet?.balance || 0) - (wallet?.frozenBalance || 0);

  return (
    <div className="rounded-xl bg-[var(--brand-dark)] p-6 text-[var(--card)] shadow-[0_4px_20px_rgba(2,35,53,0.1)] border border-border mb-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[1.4rem] font-semibold m-0">{t("wallet_balance")}</h3>
        <span className="bg-white/10 px-3 py-1.5 rounded-2xl text-[0.8rem] font-medium border border-white/20">
          {wallet?.currencyCode || currency.code}
        </span>
      </div>

      <div className="text-center mb-5">
        <span className="text-[2.5rem] font-bold mr-2">
          {wallet?.balance ? Number(wallet.balance).toFixed(2) : "0.00"}
        </span>
        <span className="text-[1.3rem] opacity-90 font-medium">{currency.symbol}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/10 border border-white/10 p-4 text-center">
          <span className="block text-[0.8rem] opacity-85 mb-1.5 font-medium">{t("available_balance")}</span>
          <span className="text-[1.1rem] font-semibold text-[var(--brand-success)]">
            {Number(availableBalance).toFixed(2)}
          </span>
        </div>
        <div className="rounded-lg bg-white/10 border border-white/10 p-4 text-center">
          <span className="block text-[0.8rem] opacity-85 mb-1.5 font-medium">{t("frozen_balance")}</span>
          <span className="text-[1.1rem] font-semibold text-[var(--brand-warning)]">
            {wallet?.frozenBalance ? Number(wallet.frozenBalance).toFixed(2) : "0.00"}
          </span>
        </div>
      </div>

      <div className="text-center mt-4">
        <span className={`inline-block px-3 py-1.5 rounded-2xl text-xs font-semibold uppercase ${
          wallet?.status?.toLowerCase() === 'active'
            ? 'bg-[var(--brand-success)] text-[var(--card)]'
            : wallet?.status?.toLowerCase() === 'frozen'
            ? 'bg-[var(--brand-warning)] text-[var(--brand-dark-fg)]'
            : wallet?.status?.toLowerCase() === 'suspended'
            ? 'bg-primary text-[var(--card)]'
            : 'bg-muted text-[var(--card)]'
        }`}>
          {wallet?.status || 'INACTIVE'}
        </span>
      </div>
    </div>
  );
};

export default WalletBalanceCard;
