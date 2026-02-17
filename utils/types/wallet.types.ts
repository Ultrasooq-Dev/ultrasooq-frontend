export interface IWallet {
  id: number;
  userId: number;
  userAccountId?: number;
  currencyCode: string;
  balance: number;
  frozenBalance: number;
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface IWalletTransaction {
  id: number;
  walletId: number;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'PAYMENT' | 'REFUND' | 'COMMISSION' | 'BONUS' | 'FEE';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  referenceType?: 'ORDER' | 'PAYMENT' | 'TRANSFER' | 'COMMISSION' | 'REFUND' | 'BONUS';
  description?: string;
  metadata?: Record<string, unknown>;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface IWalletTransfer {
  id: number;
  fromWalletId: number;
  toWalletId: number;
  amount: number;
  transferFee: number;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface IWalletSettings {
  id: number;
  userId: number;
  autoWithdraw: boolean;
  withdrawLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  notificationPreferences: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

// Request/Response types
export interface IWalletDepositRequest {
  amount: number;
  paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'STRIPE' | 'AMWALPAY';
  paymentIntentId?: string;
  transactionId?: string; // For AmwalPay transaction ID
}

export interface IWalletWithdrawRequest {
  amount: number;
  bankAccountId?: string;
  withdrawalMethod: 'BANK_TRANSFER' | 'PAYPAL';
}

export interface IWalletTransferRequest {
  toUserId: number;
  toUserAccountId?: number;
  amount: number;
  description?: string;
}

export interface IWalletBalanceResponse {
  message: string;
  status: boolean;
  data: IWallet;
}

export interface IWalletTransactionsResponse {
  message: string;
  status: boolean;
  data: {
    data: IWalletTransaction[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface IWalletSettingsResponse {
  message: string;
  status: boolean;
  data: IWalletSettings;
}

// Transaction types for UI
export const WALLET_TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  PAYMENT: 'PAYMENT',
  REFUND: 'REFUND',
  COMMISSION: 'COMMISSION',
  BONUS: 'BONUS',
  FEE: 'FEE',
} as const;

export const WALLET_STATUS = {
  ACTIVE: 'ACTIVE',
  FROZEN: 'FROZEN',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
