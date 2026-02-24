import http from "../http";
import urlcat from "urlcat";
import {
  IWalletDepositRequest,
  IWalletWithdrawRequest,
  IWalletTransferRequest,
  IWalletSettings,
} from "@/utils/types/wallet.types";

export const fetchWalletBalance = () => {
  return http({
    method: "GET",
    url: `/wallet/balance`,
  });
};

export const depositToWallet = (payload: IWalletDepositRequest) => {
  return http({
    method: "POST",
    url: `/wallet/deposit`,
    data: payload,
  });
};

export const withdrawFromWallet = (payload: IWalletWithdrawRequest) => {
  return http({
    method: "POST",
    url: `/wallet/withdraw`,
    data: payload,
  });
};

export const transferToUser = (payload: IWalletTransferRequest) => {
  return http({
    method: "POST",
    url: `/wallet/transfer`,
    data: payload,
  });
};

export const fetchWalletTransactions = (payload: {
  page: number;
  limit: number;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/wallet/transactions`, payload),
  });
};

export const fetchWalletTransactionById = (transactionId: number) => {
  return http({
    method: "GET",
    url: `/wallet/transactions/${transactionId}`,
  });
};

export const fetchWalletSettings = () => {
  return http({
    method: "GET",
    url: `/wallet/settings`,
  });
};

export const updateWalletSettings = (payload: Partial<IWalletSettings>) => {
  return http({
    method: "PUT",
    url: `/wallet/settings`,
    data: payload,
  });
};

// Admin APIs (for future use)
export const fetchAllWallets = (payload: {
  page: number;
  limit: number;
  userId?: number;
  status?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/admin/wallets`, payload),
  });
};

export const updateWalletStatus = (walletId: number, status: string) => {
  return http({
    method: "PUT",
    url: `/admin/wallets/${walletId}/status`,
    data: { status },
  });
};

export const fetchAllWalletTransactions = (payload: {
  page: number;
  limit: number;
  userId?: number;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/admin/transactions`, payload),
  });
};

export const createAmwalPayWalletConfig = (payload: Record<string, unknown>) => {
  return http({
    method: "POST",
    url: `/payment/create-amwalpay-wallet-config`,
    data: payload,
  });
};

export const verifyAmwalPayWalletPayment = (payload: Record<string, unknown>) => {
  return http({
    method: "POST",
    url: `/payment/verify-amwalpay-wallet-payment`,
    data: payload,
  });
};