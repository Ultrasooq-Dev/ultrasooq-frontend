import axios from "axios";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";
import {
  IWalletDepositRequest,
  IWalletWithdrawRequest,
  IWalletTransferRequest,
  IWalletSettings,
} from "@/utils/types/wallet.types";

export const fetchWalletBalance = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/wallet/balance`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const depositToWallet = (payload: IWalletDepositRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/wallet/deposit`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const withdrawFromWallet = (payload: IWalletWithdrawRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/wallet/withdraw`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const transferToUser = (payload: IWalletTransferRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/wallet/transfer`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchWalletTransactions = (payload: {
  page: number;
  limit: number;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/wallet/transactions`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchWalletTransactionById = (transactionId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/wallet/transactions/${transactionId}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchWalletSettings = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/wallet/settings`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const updateWalletSettings = (payload: Partial<IWalletSettings>) => {
  return axios({
    method: "PUT",
    url: `${getApiUrl()}/wallet/settings`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

// Admin APIs (for future use)
export const fetchAllWallets = (payload: {
  page: number;
  limit: number;
  userId?: number;
  status?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/admin/wallets`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const updateWalletStatus = (walletId: number, status: string) => {
  return axios({
    method: "PUT",
    url: `${getApiUrl()}/admin/wallets/${walletId}/status`,
    data: { status },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/admin/transactions`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const createAmwalPayWalletConfig = (payload: Record<string, unknown>) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/payment/create-amwalpay-wallet-config`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const verifyAmwalPayWalletPayment = (payload: Record<string, unknown>) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/payment/verify-amwalpay-wallet-payment`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};