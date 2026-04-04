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
      <div className="wallet_balance_card">
        <div className="balance_header">
          <h3>{t("wallet_balance")}</h3>
          <div className="skeleton skeleton_text"></div>
        </div>
        <div className="balance_amount">
          <div className="skeleton skeleton_amount"></div>
        </div>
        <div className="balance_details">
          <div className="detail_item">
            <div className="skeleton skeleton_text"></div>
            <div className="skeleton skeleton_text"></div>
          </div>
          <div className="detail_item">
            <div className="skeleton skeleton_text"></div>
            <div className="skeleton skeleton_text"></div>
          </div>
        </div>
      </div>
    );
  }

  const availableBalance = (wallet?.balance || 0) - (wallet?.frozenBalance || 0);

  return (
    <div className="wallet_balance_card">
      <div className="balance_header">
        <h3>{t("wallet_balance")}</h3>
        <span className="currency">{wallet?.currencyCode || currency.code}</span>
      </div>
      
      <div className="balance_amount">
        <span className="amount">
          {wallet?.balance ? Number(wallet.balance).toFixed(2) : "0.00"}
        </span>
        <span className="currency_symbol">{currency.symbol}</span>
      </div>
      
      <div className="balance_details">
        <div className="detail_item">
          <span className="label">{t("available_balance")}</span>
          <span className="value available">
            {Number(availableBalance).toFixed(2)}
          </span>
        </div>
        <div className="detail_item">
          <span className="label">{t("frozen_balance")}</span>
          <span className="value frozen">
            {wallet?.frozenBalance ? Number(wallet.frozenBalance).toFixed(2) : "0.00"}
          </span>
        </div>
      </div>

      <div className="wallet_status">
        <span className={`status_badge ${wallet?.status?.toLowerCase() || 'inactive'}`}>
          {wallet?.status || 'INACTIVE'}
        </span>
      </div>
    </div>
  );
};

export default WalletBalanceCard;
