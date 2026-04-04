"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useDepositToWallet, useWithdrawFromWallet, useTransferToUser, useCreateAmwalPayWalletConfig, useVerifyAmwalPayWalletPayment } from "@/apis/queries/wallet.queries";
import { useQueryClient } from "@tanstack/react-query";
import { IWallet } from "@/utils/types/wallet.types";
import { AmwalPayConfigData } from "@/types/order";

// Declare SmartBox global type
declare global {
  interface Window {
    SmartBox: {
      Checkout: {
        configure: any;
        showSmartBox: () => void;
      };
    };
  }
}

interface WalletActionsProps {
  wallet: IWallet | null;
}

const WalletActions: React.FC<WalletActionsProps> = ({ wallet }) => {
  const t = useTranslations();
  const { currency, langDir, selectedLocale } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [transferUserId, setTransferUserId] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const depositMutation = useDepositToWallet();
  const withdrawMutation = useWithdrawFromWallet();
  const transferMutation = useTransferToUser();
  const createAmwalPayWalletConfig = useCreateAmwalPayWalletConfig();
  const verifyAmwalPayWalletPayment = useVerifyAmwalPayWalletPayment();

  // Load AmwalPay Smartbox script
  useEffect(() => {
    // Check if Smartbox is already loaded
    if (window.SmartBox && window.SmartBox.Checkout) {
      return;
    }

    // Load AmwalPay Smartbox script (UAT environment for testing)
    const script = document.createElement('script');
    script.src = 'https://test.amwalpg.com:7443/js/SmartBox.js?v=1.1';
    script.async = true;
    script.onload = () => {};
    script.onerror = () => {
      console.error('Failed to load AmwalPay Smartbox');
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount as it might be used elsewhere
    };
  }, []);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: t("invalid_amount"),
        description: t("please_enter_valid_amount"),
        variant: "danger",
      });
      return;
    }

    if (!wallet) {
      toast({
        title: t("error"),
        description: "Wallet not found",
        variant: "danger",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Use AmwalPay for wallet recharge
      await handleAmwalPayWalletRecharge(parseFloat(amount));
    } catch (error) {
      toast({
        title: t("deposit_failed"),
        description: t("unable_to_add_funds"),
        variant: "danger",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Add new function for AmwalPay wallet recharge
  const handleAmwalPayWalletRecharge = async (amount: number) => {
    if (!wallet) {
      toast({
        title: t("error"),
        description: "Wallet not found",
        variant: "danger",
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      // AmwalPay supports 'ar' and 'en' — map from selected locale
      const currentLang = selectedLocale === 'ar' ? 'ar' : 'en';
      
      const response = await createAmwalPayWalletConfig.mutateAsync({
        amount: amount,
        walletId: wallet.id,
        languageId: currentLang
      });

      if (response?.status && response?.data) {
        const config = response.data as AmwalPayConfigData;

        if (!window.SmartBox || !window.SmartBox.Checkout) {
          setIsProcessingPayment(false);
          toast({
            title: t("payment_error"),
            description: "Payment gateway not loaded. Please refresh the page.",
            variant: "danger",
          });
          return;
        }

        window.SmartBox.Checkout.configure = {
          MID: config.MID,
          TID: config.TID,
          CurrencyId: config.CurrencyId,
          AmountTrxn: config.AmountTrxn,
          MerchantReference: config.MerchantReference,
          LanguageId: config.LanguageId,
          PaymentViewType: config.PaymentViewType,
          TrxDateTime: config.TrxDateTime,
          SessionToken: config.SessionToken || '',
          SecureHash: config.SecureHash,
          completeCallback: async function(data: any) {
            setIsProcessingPayment(false);
            
            const isSuccess = 
              (data.responseCode === '00' && data.success === true) ||
              (data.responseCode === '00' && data.isSuccess !== false) ||
              (data.responseCode === '00') ||
              (data.success === true) ||
              (data.data?.responseCode === '00') ||
              (data.data?.success === true) ||
              (data.data?.auth === 'AUTHORIZED') ||
              (data.auth === 'AUTHORIZED');
            
            if (isSuccess) {
              // Extract transaction details
              const transactionId = 
                data.transactionId || 
                data.data?.transactionId || 
                data.data?.hostResponseData?.transactionId ||
                data.data?.paymentId ||
                data.paymentId ||
                config.MerchantReference;
              
              const amountValue = data.data?.amount || data.amount || amount;
              const merchantRef = config.MerchantReference;

              // Verify payment with backend (fallback if webhook doesn't fire)
              try {
                await verifyAmwalPayWalletPayment.mutateAsync({
                  merchantReference: merchantRef,
                  transactionId: transactionId,
                  amount: amountValue
                });
              } catch (verifyError) {
                console.error('Error verifying payment:', verifyError);
                // Continue anyway - webhook might process it
              }

              toast({
                title: t("deposit_successful") || "Deposit Successful",
                description: t("funds_added_to_wallet") || "Funds have been added to your wallet",
                variant: "success",
              });
              
              // Wait a bit for webhook to process, then refresh wallet balance and transactions
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
                queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
              }, 2000); // Wait 2 seconds for webhook to process
              
              // Also refresh immediately and again after delay
              queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
              queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
              
              setAmount("");
              setActiveAction(null);
            } else {
              toast({
                title: t("deposit_failed") || "Deposit Failed",
                description: data.message || data.ResponseMessage || t("unable_to_add_funds") || "Unable to add funds",
                variant: "danger",
              });
            }
          },
          errorCallback: function(data: any) {
            console.error('AmwalPay Wallet Recharge Error:', data);
            setIsProcessingPayment(false);
            toast({
              title: t("deposit_failed") || "Deposit Failed",
              description: data.ResponseMessage || data.message || t("unable_to_add_funds") || "Unable to add funds",
              variant: "danger",
            });
          },
          cancelCallback: function() {
            setIsProcessingPayment(false);
            toast({
              title: t("payment_cancelled") || "Payment Cancelled",
              description: t("payment_was_cancelled") || "Payment was cancelled",
              variant: "default",
            });
          }
        };

        window.SmartBox.Checkout.showSmartBox();
      } else {
        setIsProcessingPayment(false);
        toast({
          title: t("deposit_failed"),
          description: response.message || 'Failed to initialize payment',
          variant: "danger",
        });
      }
    } catch (error: any) {
      setIsProcessingPayment(false);
      console.error('AmwalPay Wallet Recharge Error:', error);
      toast({
        title: t("deposit_failed"),
        description: error.message || 'Failed to process payment',
        variant: "danger",
      });
    }
  };

  // const handleWithdraw = async () => {
  //   if (!amount || parseFloat(amount) <= 0) {
  //     toast({
  //       title: t("invalid_amount"),
  //       description: t("please_enter_valid_amount"),
  //       variant: "danger",
  //     });
  //     return;
  //   }

  //   if (wallet && parseFloat(amount) > wallet.balance) {
  //     toast({
  //       title: t("insufficient_balance"),
  //       description: t("amount_exceeds_wallet_balance"),
  //       variant: "danger",
  //     });
  //     return;
  //   }

  //   setIsProcessing(true);
  //   try {
  //     await withdrawMutation.mutateAsync({
  //       amount: parseFloat(amount),
  //       withdrawalMethod: "BANK_TRANSFER",
  //     });
      
  //     toast({
  //       title: t("withdrawal_successful"),
  //       description: t("withdrawal_request_submitted"),
  //       variant: "success",
  //     });
      
  //     setAmount("");
  //     setActiveAction(null);
  //   } catch (error) {
  //     toast({
  //       title: t("withdrawal_failed"),
  //       description: t("unable_to_process_withdrawal"),
  //       variant: "danger",
  //     });
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  // const handleTransfer = async () => {
  //   if (!amount || parseFloat(amount) <= 0) {
  //     toast({
  //       title: t("invalid_amount"),
  //       description: t("please_enter_valid_amount"),
  //       variant: "danger",
  //     });
  //     return;
  //   }

  //   if (!transferUserId) {
  //     toast({
  //       title: t("invalid_user"),
  //       description: t("please_enter_user_id"),
  //       variant: "danger",
  //     });
  //     return;
  //   }

  //   if (wallet && parseFloat(amount) > wallet.balance) {
  //     toast({
  //       title: t("insufficient_balance"),
  //       description: t("amount_exceeds_wallet_balance"),
  //       variant: "danger",
  //     });
  //     return;
  //   }

  //   setIsProcessing(true);
  //   try {
  //     await transferMutation.mutateAsync({
  //       toUserId: parseInt(transferUserId),
  //       amount: parseFloat(amount),
  //       description: description || undefined,
  //     });
      
  //     toast({
  //       title: t("transfer_successful"),
  //       description: t("funds_transferred_successfully"),
  //       variant: "success",
  //     });
      
  //     setAmount("");
  //     setTransferUserId("");
  //     setDescription("");
  //     setActiveAction(null);
  //   } catch (error) {
  //     toast({
  //       title: t("transfer_failed"),
  //       description: t("unable_to_transfer_funds"),
  //       variant: "danger",
  //     });
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
        {t("wallet_actions")}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Deposit */}
        <div className="border border-border rounded-lg p-4 hover:border-[#FF9900] transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">{t("deposit")}</h4>
              <p className="text-xs text-muted-foreground">{t("add_funds_to_wallet")}</p>
            </div>
            <div className="w-10 h-10 bg-success/5 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          
          {activeAction === "deposit" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("amount")}</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                  dir={langDir}
                  disabled={isProcessing || isProcessingPayment}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeposit}
                  disabled={isProcessing || isProcessingPayment}
                  className="flex-1 bg-[#FF9900] hover:bg-[#FF8800] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing || isProcessingPayment ? t("processing") : t("deposit")}
                </button>
                <button
                  onClick={() => {
                    setActiveAction(null);
                    setAmount("");
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveAction("deposit")}
              className="w-full mt-3 bg-[#FF9900] hover:bg-[#FF8800] text-white text-sm font-medium py-2.5 px-4 rounded-md transition-colors"
            >
              {t("deposit")}
            </button>
          )}
        </div>

        {/* Withdraw - Commented out for now */}
        {/* <div className="border border-border rounded-lg p-4 hover:border-[#FF9900] transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">{t("withdraw")}</h4>
              <p className="text-xs text-muted-foreground">{t("withdraw_funds_from_wallet")}</p>
            </div>
            <div className="w-10 h-10 bg-destructive/5 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
          
          {activeAction === "withdraw" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("amount")}</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                  dir={langDir}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleWithdraw}
                  disabled={isProcessing}
                  className="flex-1 bg-[#FF9900] hover:bg-[#FF8800] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isProcessing ? t("processing") : t("withdraw")}
                </button>
                <button
                  onClick={() => {
                    setActiveAction(null);
                    setAmount("");
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-md hover:bg-muted"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveAction("withdraw")}
              disabled={!wallet || wallet.balance <= 0}
              className="w-full mt-3 bg-card hover:bg-muted text-[#FF9900] border border-[#FF9900] text-sm font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("withdraw")}
            </button>
          )}
        </div> */}

        {/* Transfer - Commented out for now */}
        {/* <div className="border border-border rounded-lg p-4 hover:border-[#FF9900] transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">{t("transfer")}</h4>
              <p className="text-xs text-muted-foreground">{t("transfer_funds_to_user")}</p>
            </div>
            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          
          {activeAction === "transfer" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("user_id")}</label>
                <input
                  type="text"
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("amount")}</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                  dir={langDir}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("description")} ({t("optional")})</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("transfer_description_placeholder")}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleTransfer}
                  disabled={isProcessing}
                  className="flex-1 bg-[#FF9900] hover:bg-[#FF8800] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isProcessing ? t("processing") : t("transfer")}
                </button>
                <button
                  onClick={() => {
                    setActiveAction(null);
                    setAmount("");
                    setTransferUserId("");
                    setDescription("");
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-md hover:bg-muted"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveAction("transfer")}
              disabled={!wallet || wallet.balance <= 0}
              className="w-full mt-3 bg-card hover:bg-muted text-[#FF9900] border border-[#FF9900] text-sm font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("transfer")}
            </button>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default WalletActions;
