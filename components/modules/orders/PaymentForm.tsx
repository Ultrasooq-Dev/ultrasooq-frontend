import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";
import { useCreatePaymentIntent } from "@/apis/queries/orders.queries";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useWalletBalance } from "@/apis/queries/wallet.queries";

type PaymentFormProps = {
  onCreateOrder: (paymentType: string, paymentIntent: string) => void;
  calculateTotalAmount: () => void;
  isLoading: boolean;
  onManageAmount: (advanceAmount: string) => void;
  clearCardElement: boolean;
};

// Load Stripe with your public key
const stripePromise = loadStripe('pk_test_51QuptGPQ2VnoEyMPay2u4FyltporIQfMh9hWcp2EEresPjx07AuT4lFLuvnNrvO7ksqtaepmRQHfYs4FLia8lIV500i83tXYMR');

const PaymentForm: React.FC<PaymentFormProps> = ({
  onCreateOrder,
  calculateTotalAmount,
  isLoading,
  onManageAmount,
  clearCardElement
}) => {
  const t = useTranslations();
  const { langDir, currency, user } = useAuth();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const createIntent = useCreatePaymentIntent();
  const { data: walletData } = useWalletBalance(!!user);
  const [name, setName] = useState("");
  const [clientSecret, setClientSecret] = useState(""); // State to store response data 
  // const [paymentIntentId, setPaymentIntentId] = useState(null); // State to store response data 
  const [isCardLoading, setIsCardLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false); // Track if card details are valid
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [inputValue, setInputValue] = useState(""); // Temporary input value
  const [advanceAmount, setAdvanceAmount] = useState(""); // Stored amount when "Save" is clicked

  // Expose a method to clear CardElement
  useEffect(() => {
    if (clearCardElement && elements) {
      elements.getElement(CardElement)?.clear();
      setName("");
      setInputValue("");
    }
  }, [clearCardElement, elements]);

  const handleCardPayment = async (paymentType: string) => {
    setSelectedPaymentType(paymentType); // Single state to track selected type
    // if(paymentType === 'direct') handleIntentCreate()
  }

  const handleIntentCreate = async (paymentMethodId: string) => {
    const data = {
      amount: selectedPaymentType === 'direct' ? calculateTotalAmount() : Number(inputValue),
      paymentMethod: "CARD",
      paymentMethodId: paymentMethodId
    }

    const response = await createIntent.mutateAsync(data);

    if (response?.status && response?.data) {
      onCreateOrder(selectedPaymentType, response?.data?.id);
    } else {
      toast({
        title: t("payment_error"),
        description: response.message,
        variant: "danger",
      });
    }
    // }

  }

  // Handle card input change
  const handleCardChange = (event: any) => {
    setCardComplete(event.complete); // event.complete is true when the card details are valid
  };

  const handlePayment = async () => {
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: { name: name },
    });

    if (error) {
      toast({
        title: t("payment_error"),
        description: error.message,
        variant: "danger",
      });
    } else {
      // onCreateOrder("directPayment", { paymentMethodId: paymentMethod.id });
      handleIntentCreate(paymentMethod.id);

    }
  };

  // for Attachment

  const handleAttachment = () => {
    alert('hi');
  }

  // Handle wallet payment
  const handleWalletPayment = () => {
    const totalAmount = calculateTotalAmount();
    const walletBalance = walletData?.data?.balance || 0;
    
    if (walletBalance < totalAmount) {
      toast({
        title: t("insufficient_balance"),
        description: t("amount_exceeds_wallet_balance"),
        variant: "danger",
      });
      return;
    }
    
    onCreateOrder('WALLET', '');
  }


  return (
    <div className="cart-page-left">
      <div className="order_accordion w-full">
        <Accordion>
          <AccordionItem>
            <AccordionItemHeading>
              <AccordionItemButton dir={langDir} translate="no">{t("cash")}</AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel>
              <div className="w-full bg-card">
                <div className="bodyPart">
                  <div className="card-item card-payment-form px-5 pb-5 pt-3">
                    <div className="flex flex-wrap">
                      <div className="mb-4 w-full space-y-2">
                        <p>
                          Exercitation in fugiat est ut ad ea cupidatat ut in
                          cupidatat occaecat ut occaecat
                        </p>
                      </div>
                    </div>
                    <div className="order-action-btn half_button">
                      <Button
                        onClick={() => onCreateOrder('CASH', "")}
                        disabled={isLoading}
                        className="theme-primary-btn order-btn"
                        dir={langDir}
                        translate="no"
                      >
                        {t("confirm_order")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionItemPanel>
          </AccordionItem>

          {user && walletData?.data && (
            <AccordionItem>
              <AccordionItemHeading>
                <AccordionItemButton dir={langDir} translate="no">
                  {t("pay_with_wallet")} ({currency.symbol}{walletData.data.balance ? Number(walletData.data.balance).toFixed(2) : "0.00"})
                </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>
                <div className="w-full bg-card">
                  <div className="bodyPart">
                    <div className="card-item card-payment-form px-5 pb-5 pt-3">
                      <div className="flex flex-wrap">
                        <div className="mb-4 w-full space-y-2">
                          <p>
                            {t("pay_with_wallet_description")}
                          </p>
                          <div className="wallet_balance_info">
                            <div className="balance_item">
                              <span className="balance_label">{t("wallet_balance")}:</span>
                              <span className="balance_value">{currency.symbol}{walletData.data.balance ? Number(walletData.data.balance).toFixed(2) : "0.00"}</span>
                            </div>
                            <div className="balance_item">
                              <span className="balance_label">{t("order_total")}:</span>
                              <span className="balance_value">{currency.symbol}{Number(calculateTotalAmount()).toFixed(2)}</span>
                            </div>
                            <div className="balance_item">
                              <span className="balance_label">{t("remaining_after_payment")}:</span>
                              <span className={`balance_value ${(Number(walletData.data.balance || 0) - Number(calculateTotalAmount())) < 0 ? 'insufficient' : 'sufficient'}`}>
                                {currency.symbol}{(Number(walletData.data.balance || 0) - Number(calculateTotalAmount())).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="order-action-btn half_button">
                        <Button
                          onClick={handleWalletPayment}
                          disabled={isLoading || (walletData.data.balance || 0) < calculateTotalAmount()}
                          className="theme-primary-btn order-btn"
                          dir={langDir}
                          translate="no"
                        >
                          {isLoading ? t("processing") : t("pay_with_wallet")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItemPanel>
            </AccordionItem>
          )}

          <AccordionItem>
            <AccordionItemHeading onClick={() => handleCardPayment('direct')}>
              <AccordionItemButton dir={langDir} translate="no">{t("direct_payment")}</AccordionItemButton>
            </AccordionItemHeading>
            {selectedPaymentType === 'direct' ?
              <AccordionItemPanel>
                <div className="w-full bg-card">
                  <div className="bodyPart">
                    <div className="card-item card-payment-form px-5 pb-5 pt-3">
                      <div className="flex flex-wrap">
                        <div className="mb-4 w-full space-y-2">
                          <label
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            dir={langDir}
                            translate="no"
                          >
                            {t("card_holder_name")}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={t("card_holder_name")}
                              className="theme-form-control-s1 flex h-9 w-full rounded-md border
           border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors 
           file:border-0 file:bg-transparent file:text-sm file:font-medium 
           placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring 
           disabled:cursor-not-allowed disabled:opacity-50"
                              dir={langDir}
                              translate="no"
                            />
                          </div>
                        </div>

                        <div className="mb-4 w-full space-y-2" style={{ width: '650px' }}>
                          <label className="text-sm font-medium" dir={langDir} translate="no">{t("card_details")}</label>
                          <div className="theme-form-control-s1 border p-2">
                            <CardElement options={{ hidePostalCode: true }} onChange={handleCardChange} />
                          </div>
                        </div>
                      </div>
                      <div className="order-action-btn">
                        <Button onClick={handlePayment} disabled={isLoading || !stripe || !name.trim() || !cardComplete} className="theme-primary-btn order-btn" translate="no">
                          {isLoading ? t("processing") : t("confirm_payment")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItemPanel>
              : null}
          </AccordionItem>


          <AccordionItem>
            <AccordionItemHeading onClick={() => handleCardPayment('advance')}>
              <AccordionItemButton dir={langDir} translate="no">{t("advance_payment")}(%)</AccordionItemButton>
            </AccordionItemHeading>
            {selectedPaymentType === 'advance' ?
              <AccordionItemPanel>
                <div className="w-full bg-card">
                  <div className="bodyPart">
                    <div className="card-item card-payment-form px-5 pb-5 pt-3">
                      <div className="w-full">
                        <Button className="theme-primary-btn order-btn mt-2 h-14 w-full p-4" dir={langDir} translate="no">
                          {t("attached_transaction_receipt")}
                        </Button>
                        <div className="mt-3 flex w-auto flex-wrap rounded-sm bg-[#B3B3B3] px-10 py-7">
                          <div className="relative mb-3 w-[80%]">
                            <label className="mb-2 text-lg font-semibold text-foreground" dir={langDir} translate="no">
                              {t("payment_amount")}({currency.symbol}):
                            </label>
                            <input
                              type="number"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)} // Allow empty value
                              className="h-12 w-full rounded-[5px] bg-card px-4 py-3 text-lg text-foreground focus:shadow-none focus:outline-hidden"
                            />
                          </div>
                          <div className="relative mb-3 flex w-[20%] items-end justify-center text-center">
                            <input
                              type="file"
                              className="absolute left-0 top-0 h-full w-full opacity-0"
                            />
                            <img
                              src="/images/attach.png"
                              alt=""
                              className="h-auto w-[38px]"
                            />
                          </div>
                          <div className="mt-2 flex h-auto w-full items-center justify-center gap-5">
                            <button
                              type="button"
                              onClick={() => {
                                setAdvanceAmount(inputValue);
                                onManageAmount(inputValue);
                                // handleIntentCreate();
                              }} // Set saved amount 
                              disabled={!inputValue} // Disable if inputValue is empty
                              className="flex h-[50px] w-[150px] items-center justify-center rounded-sm bg-[#FFC7C2] p-3 text-center text-lg font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              dir={langDir}
                              translate="no"
                            >
                              {t("save")}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInputValue(""); // Clear input field
                                setAdvanceAmount(""); // Clear saved amount
                                onManageAmount("")
                              }}
                              disabled={!inputValue} // Disable if inputValue is empty
                              className="flex h-[50px] w-[150px] items-center justify-center rounded-sm bg-[#FFC7C2] p-3 text-center text-lg font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              dir={langDir}
                              translate="no"
                            >
                              {t("cancel")}
                            </button>
                          </div>
                        </div>
                      </div>


                      <div className="flex flex-wrap">
                        <div className="mb-4 w-full space-y-2">
                          <label
                            className="text-sm font-medium 
          leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            dir={langDir}
                            translate="no"
                          >
                            {t("card_holder_name")}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={t("card_holder_name")}
                              className="theme-form-control-s1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1"
                              dir={langDir}
                              translate="no"
                            />
                          </div>
                        </div>
                        <div className="mb-4 w-full space-y-2" style={{ width: '650px' }}>
                          <label className="text-sm font-medium" dir={langDir} translate="no">{t("card_details")}</label>
                          <div className="theme-form-control-s1 border p-2">
                            <CardElement options={{ hidePostalCode: true }} onChange={handleCardChange} />
                          </div>
                        </div>
                      </div>
                      <div className="order-action-btn">
                        <div className="order-action-btn">
                          <Button onClick={handlePayment} disabled={isLoading || !stripe || !name.trim() || !cardComplete || advanceAmount === ''} className="theme-primary-btn order-btn" translate="no">
                            {isLoading ? t("processing") : t("confirm_payment")}
                          </Button> &nbsp;&nbsp;
                          <Button onClick={handleAttachment} className="theme-primary-btn order-btn" translate="no">
                            {isLoading ? t("processing") : t("send_attachment")}
                          </Button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </AccordionItemPanel>
              : null}
          </AccordionItem>

          <AccordionItem>
            <AccordionItemHeading>
              <AccordionItemButton dir={langDir} translate="no">{t("pay_it_for_me")}</AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel>
              <div className="w-full bg-card">
                <div className="bodyPart">
                  <div className="card-item card-payment-form px-5 pb-5 pt-3">
                    <div className="flex flex-wrap">
                      <div className="mb-4 w-full space-y-2">
                        <p>
                          Exercitation in fugiat est ut ad ea cupidatat ut in
                          cupidatat occaecat ut occaecat
                        </p>
                      </div>
                    </div>
                    <div className="order-action-btn half_button">
                      <Button
                        onClick={() => onCreateOrder('payItForMe', "")}
                        disabled={isLoading}
                        className="theme-primary-btn order-btn"
                        dir={langDir}
                        translate="no"
                      >
                        {t("confirm_order")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionItemHeading>
              <AccordionItemButton dir={langDir} translate="no">{t("installments")}</AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel>
              <div className="w-full bg-card">
                <div className="bodyPart">
                  <div className="card-item card-payment-form px-5 pb-5 pt-3">
                    <div className="flex flex-wrap">
                      <div className="mb-4 w-full space-y-2">
                        <p>
                          Exercitation in fugiat est ut ad ea cupidatat ut in
                          cupidatat occaecat ut occaecat
                        </p>
                      </div>
                    </div>
                    <div className="order-action-btn half_button">
                      <Button
                        onClick={() => onCreateOrder('installment', "")}
                        disabled={isLoading}
                        className="theme-primary-btn order-btn"
                        dir={langDir}
                        translate="no"
                      >
                        {t("confirm_order")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionItemPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default PaymentForm;
