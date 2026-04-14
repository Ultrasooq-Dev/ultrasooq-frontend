"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface CheckoutSummaryProps {
  itemsTotal: number;
  shippingCharge: number;
  fee: number;
  totalAmount: number;
  isFromRfq: boolean;
  rfqQuoteData: any;
  memoizedCartList: any[];
  rfqQuoteDetailsQuery: any;
  updateCartByDevice: any;
  updateCartWithLogin: any;
  cartListByDeviceQuery: any;
  cartListByUser: any;
  allUserAddressQuery: any;
  preOrderCalculation: any;
  onSaveOrder: () => void;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  itemsTotal,
  shippingCharge,
  fee,
  totalAmount,
  isFromRfq,
  rfqQuoteData,
  memoizedCartList,
  rfqQuoteDetailsQuery,
  updateCartByDevice,
  updateCartWithLogin,
  cartListByDeviceQuery,
  cartListByUser,
  allUserAddressQuery,
  preOrderCalculation,
  onSaveOrder,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-8">
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted">
            <h2
              className="text-xl font-semibold text-foreground"
              dir={langDir}
              translate="no"
            >
              {t("order_summary")}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span
                className="text-muted-foreground"
                dir={langDir}
                translate="no"
              >
                {t("subtotal")}
              </span>
              <span className="font-semibold text-foreground">
                {currency.symbol}
                {itemsTotal}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span
                className="text-muted-foreground"
                dir={langDir}
                translate="no"
              >
                {t("shipping")}
              </span>
              <span className="font-semibold text-foreground">
                {shippingCharge > 0 ? (
                  `${currency.symbol}${shippingCharge}`
                ) : (
                  <span className="text-success font-medium">{t("free")}</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span
                className="text-muted-foreground"
                dir={langDir}
                translate="no"
              >
                {t("fee")}
              </span>
              <span className="font-semibold text-foreground">
                {currency.symbol}
                {fee}
              </span>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span
                  className="text-lg font-semibold text-foreground"
                  dir={langDir}
                  translate="no"
                >
                  {t("total_amount")}
                </span>
                <span className="text-xl font-bold text-foreground">
                  {currency.symbol}
                  {totalAmount}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <Button
              onClick={onSaveOrder}
              disabled={
                (isFromRfq ? !rfqQuoteData : !memoizedCartList?.length) ||
                updateCartByDevice?.isPending ||
                updateCartWithLogin?.isPending ||
                cartListByDeviceQuery?.isFetching ||
                cartListByUser?.isFetching ||
                allUserAddressQuery?.isLoading ||
                preOrderCalculation?.isPending ||
                (isFromRfq && rfqQuoteDetailsQuery?.isLoading)
              }
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors duration-200"
              translate="no"
            >
              {preOrderCalculation?.isPending ? (
                <LoaderWithMessage message={t("please_wait")} />
              ) : (
                t("place_order")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
