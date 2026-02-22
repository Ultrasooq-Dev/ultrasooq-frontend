"use client";
import React, { useEffect, useState } from "react";

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
import {
  useCartListByDevice,
  useCartListByUserId,
} from "@/apis/queries/cart.queries";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId } from "@/utils/helper";
import PaymentForm from "@/components/modules/orders/PaymentForm";
import { initialOrderState, useOrderStore } from "@/lib/orderStore";
import { useToast } from "@/components/ui/use-toast";
import {
  useCreateEMIPayment,
  useCreateOrder,
  useCreateOrderUnAuth,
  useCreatePaymentIntent,
  useCreatePaymentLink,
  useCreateAmwalPayConfig,
} from "@/apis/queries/orders.queries";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useWalletBalance } from "@/apis/queries/wallet.queries";

// Load Stripe with your public key
const stripePromise = loadStripe(
  "pk_test_51QuptGPQ2VnoEyMPay2u4FyltporIQfMh9hWcp2EEresPjx07AuT4lFLuvnNrvO7ksqtaepmRQHfYs4FLia8lIV500i83tXYMR",
);

const CompleteOrderPage = () => {
  const t = useTranslations();
  const { langDir, currency, user, selectedLocale } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const hasAccessToken = !!getCookie(PUREMOON_TOKEN_KEY);
  const deviceId = getOrCreateDeviceId() || "";
  const orderStore = useOrderStore();
  const { data: walletData } = useWalletBalance(!!user);

  const createOrder = useCreateOrder();
  const createOrderUnAuth = useCreateOrderUnAuth();
  const createPaymentIntent = useCreatePaymentIntent();
  const createPaymentLink = useCreatePaymentLink();
  const createEMIPayment = useCreateEMIPayment();
  const createAmwalPayConfig = useCreateAmwalPayConfig();
  const [paymentType, setPaymentType] = useState<string>("DIRECT");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [isRedirectingToPaymob, setIsRedirectingToPaymob] = useState<boolean>(false);
  const [paymentLink, setPaymentLink] = useState<string>();
  const [emiPeriod, setEmiPeriod] = useState<number>(6);
  const [emiAmount, setEmiAmount] = useState<number>(0);

  // Load AmwalPay Smartbox script
  useEffect(() => {
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
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src*="SmartBox.js"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  // useEffect(() => {
  //   if (paymentType == "EMI") {
  //     setEmiAmount(Number((orderStore.total / emiPeriod).toFixed(2)));
  //   }
  // }, [paymentType, emiPeriod]);

  const referenceOrderId = (orderId: number) => {
    const date = new Date();

    return [
      orderId,
      date.getHours() < 10 ? `0${date.getHours()}` : String(date.getHours()),
      date.getMinutes() < 10
        ? `0${date.getMinutes()}`
        : String(date.getMinutes()),
      date.getDate() < 10 ? `0${date.getDate()}` : String(date.getDate()),
      date.getMonth() < 10 ? `0${date.getMonth()}` : String(date.getMonth()),
      date.getFullYear() < 10
        ? `0${date.getFullYear()}`
        : String(date.getFullYear()),
    ].join("-");
  };

  const copyPaymentLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      toast({
        title: t("copied"),
        description: '',
        variant: "success",
      });
    }
  };

  const handleCreateOrder = async () => {
    if (hasAccessToken) {
      if (orderStore.orders) {
        // Check if this is an RFQ order by checking sessionStorage
        const rfqQuoteData = typeof window !== "undefined" ? sessionStorage.getItem("rfqQuoteData") : null;
        const isRfqOrder = !!rfqQuoteData;
        
        // For RFQ orders, we don't need cartIds. For regular orders, we need cartIds or serviceCartIds
        if (!isRfqOrder && !orderStore.orders.cartIds?.length && !orderStore.orders.serviceCartIds?.length) {
          toast({
            title: t("order_cant_be_placed"),
            description: t("order_placed_retry_info"),
            variant: "danger",
          });
          return;
        }

        if (paymentType == "ADVANCE") {
          if (!advanceAmount) {
            toast({
              title: t("order_cant_be_placed"),
              description: t("advance_payment_is_required"),
              variant: "danger",
            });
            return;
          }

          if (advanceAmount > orderStore.total) {
            toast({
              title: t("order_cant_be_placed"),
              description: t("advance_payment_must_be_less_than_total_amount"),
              variant: "danger",
            });
            return;
          }
        }

        if (paymentType == "WALLET") {
          const walletBalance = walletData?.data?.balance || 0;
          if (walletBalance < orderStore.total) {
            toast({
              title: t("insufficient_balance"),
              description: t("amount_exceeds_wallet_balance"),
              variant: "danger",
            });
            return;
          }
        }

        let data: {[key: string]: any} = { ...orderStore.orders };
        
        // If this is an RFQ order, load RFQ data from sessionStorage
        if (isRfqOrder && rfqQuoteData) {
          try {
            const parsedRfqData = JSON.parse(rfqQuoteData);
            data.rfqQuotesUserId = parsedRfqData.rfqQuotesUserId;
            data.rfqQuotesId = parsedRfqData.rfqQuotesId;
            data.sellerId = parsedRfqData.sellerId;
            data.buyerId = parsedRfqData.buyerId;
            data.rfqQuoteProducts = parsedRfqData.quoteProducts || [];
            data.rfqSuggestedProducts = parsedRfqData.suggestedProducts || []; // NEW: Include selected suggested products
            // For RFQ orders, set empty arrays for cartIds
            data.cartIds = [];
            data.serviceCartIds = [];
          } catch (e) {
            console.error("Error parsing RFQ data:", e);
            toast({
              title: t("order_cant_be_placed"),
              description: t("order_placed_retry_info"),
              variant: "danger",
            });
            return;
          }
        }
        
        data.paymentType = paymentType;
        if (paymentType == "ADVANCE") {
          data.advanceAmount = advanceAmount;
          data.dueAmount = orderStore.total - advanceAmount;
        } else if (paymentType == "EMI") {
          // data.emiInstallmentCount = emiPeriod;
          // data.emiInstallmentAmount = emiAmount;
          // data.emiInstallmentAmountCents = emiAmount * 1000;
        } else if (paymentType == "WALLET") {
          data.paymentMethod = "WALLET";
        }

        const response = await createOrder.mutateAsync(data);
        if (response?.status) {
          if (paymentType == "PAYMENTLINK") {
            await handleCreatePaymentLink(response?.data?.id);
          } else if (paymentType == "EMI") {
            // await handleCreateEmiPayment(response?.data?.id);
          } else if (paymentType == "WALLET") {
            // Wallet payment is handled by the backend
            // Get wallet transaction ID from response
            const walletTransactionId = response?.data?.walletTransactionId;
            const transactionId = walletTransactionId 
              ? `wallet-${walletTransactionId}` 
              : `wallet-${Date.now()}`; // Fallback if not available
            
            toast({
              title: t("order_placed_successfully"),
              description: t("payment_processed_from_wallet"),
              variant: "success",
            });
            orderStore.resetOrders();
            orderStore.setTotal(0);
            // Clear RFQ data from sessionStorage if it exists
            if (typeof window !== "undefined" && isRfqOrder) {
              sessionStorage.removeItem("rfqQuoteData");
            }
            // Redirect to checkout-complete with actual wallet transaction ID from backend
            router.push(`/checkout-complete?success=true&id=${transactionId}&order=${response?.data?.id}`);
          } else {
            await handleCreatePaymentIntent(response?.data?.id);
          }
        } else {
          toast({
            title: t("something_went_wrong"),
            description: response.message,
            variant: "danger",
          });
        }
      }
    } else {
    }
  };

  const handleCreatePaymentIntent = async (orderId: number) => {
    // For DIRECT payment, use AmwalPay instead of Paymob
    if (paymentType === "DIRECT") {
      await handleAmwalPayPayment(orderId);
      return;
    }

    // For ADVANCE payment, continue with Paymob
    let data: { [key: string]: any } = {
      amount: advanceAmount * 1000,
      billing_data: {
        first_name: orderStore.orders.firstName,
        last_name: orderStore.orders.lastName,
        email: orderStore.orders.email,
        phone_number: orderStore.orders.phone,
        apartment: orderStore.orders.billingAddress,
        building: 'NA',
        street: 'NA',
        floor: 'NA',
        city: orderStore.orders.billingCity,
        state: orderStore.orders.billingProvince,
        country: orderStore.orders.billingCountry,
      },
      extras: {
        orderId: orderId,
        paymentType: paymentType,
      },
      special_reference: referenceOrderId(orderId)
    };

    const response = await createPaymentIntent.mutateAsync(data);

    if (response?.status) {
      setIsRedirectingToPaymob(true);
      window.location.assign(
        `${process.env.NEXT_PUBLIC_PAYMOB_PAYMENT_URL}?publicKey=${process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY}&clientSecret=${response.data.client_secret}`,
      );
    } else {
      toast({
        title: t("something_went_wrong"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  // Add new function for AmwalPay payment
  const handleAmwalPayPayment = async (orderId: number) => {
    try {
      const amount = orderStore.total; // Full amount for DIRECT payment
      // AmwalPay supports 'ar' and 'en' — map from selected locale
      const currentLang = selectedLocale === 'ar' ? 'ar' : 'en';
      
      setIsRedirectingToPaymob(true); // Reuse loading state

      // Get AmwalPay configuration from backend
      const response = await createAmwalPayConfig.mutateAsync({
        amount: amount,
        orderId: orderId,
        languageId: currentLang
      });

      if (response?.status && response?.data) {
        const config = response.data;

        // Check if SmartBox is loaded
        if (!window.SmartBox || !window.SmartBox.Checkout) {
          setIsRedirectingToPaymob(false);
          toast({
            title: t("payment_error"),
            description: "Payment gateway not loaded. Please refresh the page.",
            variant: "danger",
          });
          return;
        }

        // Configure Smartbox according to AmwalPay documentation
        window.SmartBox.Checkout.configure = {
          MID: config.MID,
          TID: config.TID,
          CurrencyId: config.CurrencyId,
          AmountTrxn: config.AmountTrxn,
          MerchantReference: config.MerchantReference,
          LanguageId: config.LanguageId,
          PaymentViewType: config.PaymentViewType,
          TrxDateTime: config.TrxDateTime,
          SessionToken: config.SessionToken || '', // Empty if not using recurring
          SecureHash: config.SecureHash,
          completeCallback: function(data: any) {
            setIsRedirectingToPaymob(false);
            
            // Check multiple possible success indicators
            // AmwalPay might return success in different formats
            // Note: Some responses may have isSuccess: false even with responseCode: "00"
            // So we prioritize responseCode and success fields over isSuccess
            const isSuccess = 
              (data.responseCode === '00' && data.success === true) ||
              (data.responseCode === '00' && data.isSuccess !== false) || // responseCode "00" is success unless explicitly false
              (data.responseCode === '00') ||
              (data.success === true) ||
              (data.data?.responseCode === '00') ||
              (data.data?.success === true) ||
              (data.data?.auth === 'AUTHORIZED') ||
              (data.auth === 'AUTHORIZED');
            
            if (isSuccess) {
              toast({
                title: t("payment_successful") || "Payment Successful",
                description: t("payment_processed_successfully") || "Your payment has been processed successfully",
                variant: "success",
              });
              
              // Extract transaction ID from various possible locations
              const transactionId = 
                data.transactionId || 
                data.data?.transactionId || 
                data.data?.paymentId ||
                data.paymentId ||
                data.trackId ||
                config.MerchantReference;
              
              // Redirect to success page with small delay to ensure toast shows
              setTimeout(() => {
                router.push(`/checkout-complete?success=true&id=${transactionId}&order=${orderId}`);
              }, 500);
            } else {
              // Log the actual data structure for debugging
              console.error('Payment not successful. Response data:', data);
              toast({
                title: t("payment_failed") || "Payment Failed",
                description: data.message || data.ResponseMessage || data.data?.message || t("payment_was_not_successful") || "Payment was not successful",
                variant: "danger",
              });
            }
          },
          errorCallback: function(data: any) {
            console.error('AmwalPay Payment Error:', data);
            setIsRedirectingToPaymob(false);
            toast({
              title: t("payment_failed") || "Payment Failed",
              description: data.ResponseMessage || data.message || t("something_went_wrong") || "Something went wrong",
              variant: "danger",
            });
          },
          cancelCallback: function() {
            setIsRedirectingToPaymob(false);
            toast({
              title: t("payment_cancelled") || "Payment Cancelled",
              description: t("payment_was_cancelled") || "Payment was cancelled",
              variant: "default",
            });
          }
        };

        // Show Smartbox popup
        window.SmartBox.Checkout.showSmartBox();
      } else {
        setIsRedirectingToPaymob(false);
        toast({
          title: t("something_went_wrong"),
          description: response.message || 'Failed to initialize payment',
          variant: "danger",
        });
      }
    } catch (error: any) {
      setIsRedirectingToPaymob(false);
      console.error('AmwalPay Payment Error:', error);
      toast({
        title: t("something_went_wrong"),
        description: error.message || 'Failed to process payment',
        variant: "danger",
      });
    }
  };

  const handleCreatePaymentLink = async (orderId: number) => {
    // let data = {
    //   amountCents: orderStore.total * 1000,
    //   referenceId: referenceOrderId(orderId),
    //   email: orderStore.orders.email,
    //   isLive: false,
    //   fullName: `${orderStore.orders.firstName} ${orderStore.orders.lastName}`,
    //   description: `orderId=${orderId}`
    // }

    // const response = await createPaymentLink.mutateAsync(data);

    // if (response?.success) {
    //   setPaymentLink(response?.data?.client_url);
    //   orderStore.resetOrders();
    //   orderStore.setTotal(0);
    // } else {
    //   toast({
    //     title: t("something_went_wrong"),
    //     description: response.message,
    //     variant: "danger",
    //   });
    // }

    setPaymentLink(window.location.origin + `/complete-order/${orderId}`);
    orderStore.resetOrders();
    orderStore.setTotal(0);
  };

  const handleCreateEmiPayment = async (orderId: number) => {
    let data: { [key: string]: any } = {
      amount: emiAmount * 1000,
      billing_data: {
        first_name: orderStore.orders.firstName,
        last_name: orderStore.orders.lastName,
        email: orderStore.orders.email,
        phone_number: orderStore.orders.phone,
        apartment: orderStore.orders.billingAddress,
        building: 'NA',
        street: 'NA',
        floor: 'NA',
        city: orderStore.orders.billingCity,
        state: orderStore.orders.billingProvince,
        country: orderStore.orders.billingCountry,
      },
      extras: {
        orderId: orderId,
        paymentType: paymentType,
      },
      special_reference: referenceOrderId(orderId)
    };

    const response = await createEMIPayment.mutateAsync(data);

    if (response?.status) {
      setIsRedirectingToPaymob(true);
      window.location.assign(
        `${process.env.NEXT_PUBLIC_PAYMOB_PAYMENT_URL}?publicKey=${process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY}&clientSecret=${response.data.client_secret}`,
      );
    } else {
      toast({
        title: t("something_went_wrong"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" dir={langDir} translate="no">
            {t("make_payment")}
          </h1>
          <p className="text-gray-600" dir={langDir} translate="no">
            Choose your preferred payment method to complete your order
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Options */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-900" dir={langDir} translate="no">
                  Payment Methods
                </h2>
              </div>
              
              <div className="p-6">
                <RadioGroup value={paymentType} onValueChange={(value) => {
                  setPaymentType(value);
                  if (value !== "ADVANCE") {
                    setAdvanceAmount(0);
                  }
                }} className="space-y-4">
                {/* Direct Payment Option */}
                <div className={`border-2 rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                  paymentType === "DIRECT" 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}>
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem 
                      value="DIRECT" 
                      id="direct-payment"
                      className="text-primary border-primary"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor="direct-payment" 
                        className="cursor-pointer"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900" dir={langDir} translate="no">
                            {t("direct_payment")}
                          </h3>
                          <p className="text-sm text-gray-600" dir={langDir} translate="no">
                            Pay the full amount now with your preferred payment method
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
                {/* Advance Payment Option */}
                <div className={`border-2 rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                  paymentType === "ADVANCE" 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}>
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem 
                      value="ADVANCE" 
                      id="advance-payment"
                      className="text-primary border-primary"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor="advance-payment" 
                        className="cursor-pointer"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900" dir={langDir} translate="no">
                            {t("advance_payment")}
                          </h3>
                          <p className="text-sm text-gray-600" dir={langDir} translate="no">
                            Pay a partial amount now and the rest later
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                  
                  {paymentType == "ADVANCE" && (
                    <div className="mt-6 pl-8">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2" dir={langDir} translate="no">
                          Advance Amount
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter advance amount"
                          value={advanceAmount || ''}
                          onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                          className="max-w-xs"
                        />
                        <p className="text-sm text-gray-600 mt-2" dir={langDir} translate="no">
                          Remaining: {currency.symbol}{(orderStore.total - advanceAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Wallet Payment Option */}
                {user && walletData?.data && (
                  <div className={`border-2 rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                    paymentType === "WALLET" 
                      ? "border-primary bg-primary/5 shadow-md" 
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}>
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem 
                        value="WALLET" 
                        id="wallet-payment"
                        className="text-primary border-primary"
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor="wallet-payment" 
                          className="cursor-pointer"
                        >
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900" dir={langDir} translate="no">
                              {t("pay_with_wallet")}
                            </h3>
                            <p className="text-sm text-gray-600" dir={langDir} translate="no">
                              Use your wallet balance ({currency.symbol}{walletData.data.balance ? Number(walletData.data.balance).toFixed(2) : "0.00"})
                            </p>
                          </div>
                        </Label>
                      </div>
                    </div>
                    
                    {paymentType == "WALLET" && (
                      <div className="mt-6 pl-8">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t("wallet_balance")}:</span>
                            <span className="font-semibold text-gray-900">{currency.symbol}{walletData.data.balance ? Number(walletData.data.balance).toFixed(2) : "0.00"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t("order_total")}:</span>
                            <span className="font-semibold text-gray-900">{currency.symbol}{orderStore.total || 0}</span>
                          </div>
                          <div className="border-t border-gray-300 pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">{t("remaining_after_payment")}:</span>
                              <span className={`font-semibold ${(Number(walletData.data.balance || 0) - Number(orderStore.total || 0)) < 0 ? 'text-destructive' : 'text-success'}`}>
                                {currency.symbol}{(Number(walletData.data.balance || 0) - Number(orderStore.total || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Link Option */}
                <div className={`border-2 rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                  paymentType === "PAYMENTLINK" 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}>
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem 
                      value="PAYMENTLINK" 
                      id="payment-link"
                      className="text-primary border-primary"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor="payment-link" 
                        className="cursor-pointer"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900" dir={langDir} translate="no">
                            {t("pay_it_for_me")}
                          </h3>
                          <p className="text-sm text-gray-600" dir={langDir} translate="no">
                            Generate a payment link to share with someone else
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                  
                  {paymentLink && (
                    <div className="mt-6 pl-8">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="space-y-3">
                          <Button 
                            type="button" 
                            onClick={copyPaymentLink} 
                            className="w-full bg-primary hover:bg-primary/90 text-white"
                            translate="no"
                          >
                            {t("copy_payment_link")}
                          </Button>
                          <p className="text-sm text-gray-600" dir={langDir} translate="no">
                            {t("copy_payment_link_instruction")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </RadioGroup>
              </div>
            </div>
          </div>
          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold text-gray-900" dir={langDir} translate="no">
                    {t("order_summary")}
                  </h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600" dir={langDir} translate="no">
                      {t("subtotal")}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {currency.symbol}{orderStore.total || 0}
                    </span>
                  </div>
                  
                  {advanceAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600" dir={langDir} translate="no">
                          {t("advance_payment")}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {currency.symbol}{advanceAmount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600" dir={langDir} translate="no">
                          {t("shipping")}
                        </span>
                        <span className="text-success font-medium">{t("free")}</span>
                      </div>
                    </>
                  )}
                  
                  {paymentType == "WALLET" && walletData?.data && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600" dir={langDir} translate="no">
                        {t("wallet_balance")}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {currency.symbol}{walletData.data.balance ? Number(walletData.data.balance).toFixed(2) : "0.00"}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900" dir={langDir} translate="no">
                        {t("total_amount")}
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {currency.symbol}{advanceAmount > 0 ? advanceAmount || 0 : orderStore.total || 0}
                      </span>
                    </div>
                  </div>
                  
                  {advanceAmount > 0 && (
                    <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-warning" dir={langDir} translate="no">
                          {t("due_balance")}
                        </span>
                        <span className="font-semibold text-warning">
                          {currency.symbol}{(orderStore.total - advanceAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {paymentType == "WALLET" && walletData?.data && (
                    <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-success" dir={langDir} translate="no">
                          {t("remaining_after_payment")}
                        </span>
                        <span className={`font-semibold ${(Number(walletData.data.balance || 0) - Number(orderStore.total || 0)) < 0 ? 'text-destructive' : 'text-success'}`}>
                          {currency.symbol}{(Number(walletData.data.balance || 0) - Number(orderStore.total || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {paymentType == "EMI" && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-primary" dir={langDir} translate="no">
                          {t("emi_amount")}
                        </span>
                        <span className="font-semibold text-primary">
                          {currency.symbol}{emiAmount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="px-6 pb-6">
                  <Button
                    onClick={handleCreateOrder}
                    disabled={createOrder?.isPending || 
                      createPaymentIntent?.isPending || 
                      createEMIPayment?.isPending || 
                      isRedirectingToPaymob
                    }
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors duration-200"
                    translate="no"
                  >
                    {createOrder?.isPending ? (
                      <LoaderWithMessage message={t("placing_order")} />
                    ) : createPaymentIntent?.isPending || 
                      createPaymentLink?.isPending || 
                      createEMIPayment?.isPending || 
                      isRedirectingToPaymob ? (
                      <LoaderWithMessage message={t("initiating_payment")} />
                    ) : paymentType == "WALLET" ? (
                      t("pay_with_wallet")
                    ) : (
                      t("place_order")
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteOrderPage;
