"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { IWalletTransaction } from "@/utils/types/wallet.types";
import { WALLET_TRANSACTION_TYPES, TRANSACTION_STATUS } from "@/utils/types/wallet.types";
import Pagination from "@/components/shared/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TransactionHistoryProps {
  transactions: IWalletTransaction[];
  loading?: boolean;
  pagination?: {
    page: number;
    setPage: (page: number) => void;
    total: number;
    limit: number;
  };
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  transactions, 
  loading = false,
  pagination 
}) => {
  const t = useTranslations();
  const { currency, langDir } = useAuth();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<IWalletTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "💰";
      case "WITHDRAWAL":
        return "💸";
      case "TRANSFER_IN":
        return "⬇️";
      case "TRANSFER_OUT":
        return "⬆️";
      case "PAYMENT":
        return "🛒";
      case "REFUND":
        return "↩️";
      case "COMMISSION":
        return "💼";
      case "BONUS":
        return "🎁";
      case "FEE":
        return "💳";
      default:
        return "📄";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "DEPOSIT":
      case "TRANSFER_IN":
      case "REFUND":
      case "COMMISSION":
      case "BONUS":
        return "positive";
      case "WITHDRAWAL":
      case "TRANSFER_OUT":
      case "PAYMENT":
      case "FEE":
        return "negative";
      default:
        return "neutral";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "FAILED":
      case "CANCELLED":
        return "danger";
      default:
        return "neutral";
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const typeMatch = filterType === "all" || transaction.transactionType === filterType;
    const statusMatch = filterStatus === "all" || transaction.status === filterStatus;
    return typeMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center justify-between py-4 border-b border-border animate-pulse">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </div>
            </div>
            <div className="h-5 bg-muted rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters - Amazon Style */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
        >
          <option value="all">{t("all_types")}</option>
          <option value="DEPOSIT">{t("deposit")}</option>
          <option value="WITHDRAWAL">{t("withdraw")}</option>
          <option value="TRANSFER_IN">{t("transfer_in")}</option>
          <option value="TRANSFER_OUT">{t("transfer_out")}</option>
          <option value="PAYMENT">{t("payment")}</option>
          <option value="REFUND">{t("refund")}</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
        >
          <option value="all">{t("all_statuses")}</option>
          <option value="COMPLETED">{t("completed")}</option>
          <option value="PENDING">{t("pending")}</option>
          <option value="FAILED">{t("failed")}</option>
          <option value="CANCELLED">{t("cancelled")}</option>
        </select>
      </div>

      {/* Transactions List - Amazon Style */}
      <div className="space-y-0">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-muted-foreground">{t("no_transactions_found")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="py-4 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedTransaction(transaction);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      getTransactionColor(transaction.transactionType) === "positive" 
                        ? "bg-success/5" 
                        : getTransactionColor(transaction.transactionType) === "negative"
                        ? "bg-destructive/5"
                        : "bg-muted"
                    }`}>
                      <span className="text-lg">{getTransactionIcon(transaction.transactionType)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {t(transaction.transactionType.toLowerCase())}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          getStatusColor(transaction.status) === "success"
                            ? "bg-success/10 text-success"
                            : getStatusColor(transaction.status) === "warning"
                            ? "bg-warning/10 text-warning"
                            : getStatusColor(transaction.status) === "danger"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-foreground"
                        }`}>
                          {t(transaction.status.toLowerCase())}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.description || t("no_description")}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                        <span>{new Date(transaction.createdAt).toLocaleTimeString()}</span>
                        {transaction.referenceId && (
                          <span>#{transaction.referenceId}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className={`text-sm font-semibold ${
                      getTransactionColor(transaction.transactionType) === "positive"
                        ? "text-success"
                        : getTransactionColor(transaction.transactionType) === "negative"
                        ? "text-destructive"
                        : "text-foreground"
                    }`}>
                      {getTransactionColor(transaction.transactionType) === "positive" ? "+" : "-"}
                      {currency.symbol}{Number(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pagination && pagination.total > pagination.limit && (
        <div className="mt-6 pt-4 border-t border-border">
          <Pagination
            {...{
              currentPage: pagination.page,
              totalPages: Math.ceil(pagination.total / pagination.limit),
              onPageChange: pagination.setPage,
            } as any}
          />
        </div>
      )}

      {/* Transaction Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
              {t("transaction_details")}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6 mt-4">
              {/* Transaction Type & Status */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    getTransactionColor(selectedTransaction.transactionType) === "positive" 
                      ? "bg-success/5" 
                      : getTransactionColor(selectedTransaction.transactionType) === "negative"
                      ? "bg-destructive/5"
                      : "bg-muted"
                  }`}>
                    {getTransactionIcon(selectedTransaction.transactionType)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t(selectedTransaction.transactionType.toLowerCase())}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded ${
                      getStatusColor(selectedTransaction.status) === "success"
                        ? "bg-success/10 text-success"
                        : getStatusColor(selectedTransaction.status) === "warning"
                        ? "bg-warning/10 text-warning"
                        : getStatusColor(selectedTransaction.status) === "danger"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-foreground"
                    }`}>
                      {t(selectedTransaction.status.toLowerCase())}
                    </span>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  getTransactionColor(selectedTransaction.transactionType) === "positive"
                    ? "text-success"
                    : getTransactionColor(selectedTransaction.transactionType) === "negative"
                    ? "text-destructive"
                    : "text-foreground"
                }`}>
                  {getTransactionColor(selectedTransaction.transactionType) === "positive" ? "+" : "-"}
                  {currency.symbol}{Number(selectedTransaction.amount).toFixed(2)}
                </div>
              </div>

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                    {t("transaction_id")}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    #{selectedTransaction.id}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                    {t("transaction_type")}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {t(selectedTransaction.transactionType.toLowerCase())}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                    {t("amount")}
                  </div>
                  <div className={`text-sm font-semibold ${
                    getTransactionColor(selectedTransaction.transactionType) === "positive"
                      ? "text-success"
                      : getTransactionColor(selectedTransaction.transactionType) === "negative"
                      ? "text-destructive"
                      : "text-foreground"
                  }`}>
                    {getTransactionColor(selectedTransaction.transactionType) === "positive" ? "+" : "-"}
                    {currency.symbol}{Number(selectedTransaction.amount).toFixed(2)}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                    {t("status")}
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      getStatusColor(selectedTransaction.status) === "success"
                        ? "bg-success/10 text-success"
                        : getStatusColor(selectedTransaction.status) === "warning"
                        ? "bg-warning/10 text-warning"
                        : getStatusColor(selectedTransaction.status) === "danger"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-foreground"
                    }`}>
                      {t(selectedTransaction.status.toLowerCase())}
                    </span>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                    {t("balance_before")}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {currency.symbol}{Number(selectedTransaction.balanceBefore).toFixed(2)}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                    {t("balance_after")}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {currency.symbol}{Number(selectedTransaction.balanceAfter).toFixed(2)}
                  </div>
                </div>

                {selectedTransaction.referenceId && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                      {t("reference_id")}
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {selectedTransaction.referenceId}
                    </div>
                  </div>
                )}

                {selectedTransaction.referenceType && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                      {t("reference_type")}
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {t(selectedTransaction.referenceType.toLowerCase())}
                    </div>
                  </div>
                )}

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                    {t("date")}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {new Date(selectedTransaction.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1" dir={langDir} translate="no">
                    {t("time")}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {new Date(selectedTransaction.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedTransaction.description && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2" dir={langDir} translate="no">
                    {t("description")}
                  </div>
                  <div className="text-sm text-foreground">
                    {selectedTransaction.description}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).filter(key => key !== 'processedVia').length > 0 && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2" dir={langDir} translate="no">
                    {t("additional_information")}
                  </div>
                  <div className="text-sm text-foreground space-y-1">
                    {Object.entries(selectedTransaction.metadata)
                      .filter(([key]) => key !== 'processedVia')
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHistory;
