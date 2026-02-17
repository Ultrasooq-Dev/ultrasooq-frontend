"use client";
import React, { useState } from "react";
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
  useCreateOrder,
  useCreateOrderUnAuth,
  useCreatePaymentIntent
} from "@/apis/queries/orders.queries";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

// Load Stripe with your public key
const stripePromise = loadStripe("pk_test_51QuptGPQ2VnoEyMPay2u4FyltporIQfMh9hWcp2EEresPjx07AuT4lFLuvnNrvO7ksqtaepmRQHfYs4FLia8lIV500i83tXYMR");

const OrdersPage = () => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const hasAccessToken = !!getCookie(PUREMOON_TOKEN_KEY);
  const deviceId = getOrCreateDeviceId() || "";
  const orders = useOrderStore();

  const cartListByDeviceQuery = useCartListByDevice(
    {
      page: 1,
      limit: 10,
      deviceId,
    },
    !hasAccessToken,
  );
  const cartListByUser = useCartListByUserId(
    {
      page: 1,
      limit: 10,
    },
    hasAccessToken,
  );
  const createOrder = useCreateOrder();
  const createOrderUnAuth = useCreateOrderUnAuth();
  // const createIntent = useCreateIntent();
  const [advanceAmount, setAdvanceAmount] = useState(""); 

  // const memoizedCartList = useMemo(() => {
  //   return cartListByUser.data?.data || [];
  // }, [cartListByUser.data?.data]);

  const calculateDiscountedPrice = (
    offerPrice: string | number,
    consumerDiscount: number,
  ) => {
    const price = offerPrice ? Number(offerPrice) : 0;
    const discount = consumerDiscount || 0;
    return Number((price - (price * discount) / 100).toFixed(2));
  };

  const calculateTotalAmount = () => {
    if (cartListByUser.data?.data?.length) {
      return cartListByUser.data?.data?.reduce(
        (
          acc: number,
          curr: {
            productPriceDetails: {
              offerPrice: string;
              consumerDiscount: number;
            };
            quantity: number;
          },
        ) => {
          const discount = calculateDiscountedPrice(
            curr.productPriceDetails?.offerPrice ?? 0,
            curr?.productPriceDetails?.consumerDiscount,
          );
          return Number((acc + discount * curr.quantity).toFixed(2));
        },
        0,
      );
    } else if (cartListByDeviceQuery.data?.data?.length) {
      return cartListByDeviceQuery.data?.data?.reduce(
        (
          acc: number,
          curr: {
            productPriceDetails: {
              offerPrice: string;
              consumerDiscount: number;
            };
            quantity: number;
          },
        ) => {
          const discount = calculateDiscountedPrice(
            curr.productPriceDetails?.offerPrice ?? 0,
            curr?.productPriceDetails?.consumerDiscount,
          );
          return Number((acc + discount * curr.quantity).toFixed(2));
        },
        0,
      );
    }
  };

  const handleAmount = async (getAmount:string) => {
    setAdvanceAmount(getAmount);
  }

  const [clearCard, setClearCard] = useState(false);

  const handleCreateOrder = async (paymentType: string, paymentIntentId: string) => { 
    alert(paymentType);
    if (hasAccessToken) {
      if (orders.orders) {
        if (!orders.orders.cartIds?.length) {
          toast({
            title: t("order_cant_be_placed"),
            description: t("order_placed_retry_info"),
            variant: "danger",
          });
           // Clear the CardElement before returning
           setClearCard(true);  
          return;
        }
         let data: Record<string, any> = { ...orders.orders }; // Using Record<string, any> to allow dynamic properties
       
         data.paymentMethod = paymentType;
         if (paymentIntentId )  data.paymentIntentId = paymentIntentId;
        const response = await createOrder.mutateAsync(data);

          if (response?.data) {
            toast({
              title: t("order_placed_successfully"),
              description: t("order_placed_success_info"),
              variant: "success",
            });

            orders.setOrders(initialOrderState.orders);

            paymentType === 'advance' ? setClearCard(false) : router.push("/my-orders");
          }
      }
    } else {
      if (orders.orders) {
        let data: Record<string, any> = { ...orders.orders }; // Using Record<string, any> to allow dynamic properties
       
         data.paymentMethod = paymentType;
         if (paymentIntentId )  data.paymentIntentId = paymentIntentId;
        const response = await createOrderUnAuth.mutateAsync(data);

      if (response?.data) {
        toast({
          title: t("order_placed_successfully"),
          description: t("order_placed_success_info_without_login"),
          variant: "success",
        });

        orders.setOrders(initialOrderState.orders);

        paymentType === 'advance' ? setClearCard(false) : router.push("/login");
      }
      }
      
    }
  };


  return (
    <div className="cart-page">
      <div className="container m-auto px-3">
        <div className="headerPart" dir={langDir}>
          <div className="lediv">
            <h3 translate="no">{t("make_payment")}</h3>
          </div>
        </div>
        <div className="cart-page-wrapper">
        <Elements stripe={stripePromise}>
          <PaymentForm
            onCreateOrder={handleCreateOrder}
            calculateTotalAmount={calculateTotalAmount}
            onManageAmount={handleAmount}
            isLoading={createOrder.isPending}
            clearCardElement={clearCard}
          />
          </Elements>

          <div className="cart-page-right">
            <div className="card-item priceDetails">
              <div className="card-inner-headerPart" dir={langDir}>
                <div className="lediv">
                  <h3 dir={langDir} translate="no">{t("price_details")}</h3>
                </div>
              </div>
              <div className="priceDetails-body">
                <ul>
                  <li>
                    <p dir={langDir} translate="no">{t("subtotal")}</p>
                    <h5>{currency.symbol}{calculateTotalAmount() || 0}</h5>
                  </li>
                  {advanceAmount !== "" ? 
                  <>
                    <li>
                      <p dir={langDir} translate="no">{t("advance_payment")}</p>
                      <h5>{currency.symbol}{advanceAmount || 0}</h5>
                    </li>
                    <li>
                        <p dir={langDir} translate="no">{t("shipping")}</p>
                        <h5  dir={langDir} translate="no">{t("free")}</h5>
                      </li></>
                  : null }
                </ul>
              </div>
              <div className="priceDetails-footer">
                <h4 dir={langDir} translate="no">{t("total_amount")}</h4>
                <h4 className="amount-value">
                {advanceAmount !== "" ? (advanceAmount || 0) : (calculateTotalAmount() || 0)}
                  </h4> <br />
                  {advanceAmount !== "" ? (
                    <>
                      <h4>Due Balance</h4>
                      <h4 className="amount-value">   {(calculateTotalAmount() - Number(advanceAmount)).toFixed(2)} </h4>
                    </>
                  ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
