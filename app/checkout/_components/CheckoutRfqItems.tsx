"use client";
import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import validator from "validator";

interface CheckoutRfqItemsProps {
  rfqQuoteData: any;
  rfqQuoteDetails: any;
}

const CheckoutRfqItems: React.FC<CheckoutRfqItemsProps> = ({
  rfqQuoteData,
  rfqQuoteDetails,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  if (!rfqQuoteData) return null;

  return (
    <>
      {/* RFQ Products from quoteProducts (approved pricing) */}
      {rfqQuoteData.quoteProducts?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
            {t("rfq_products") || "RFQ Products"}
          </h3>
          <div className="space-y-4">
            {rfqQuoteData.quoteProducts.map((quoteProduct: any, index: number) => {
              const product = rfqQuoteDetails?.rfqQuotesProducts?.find(
                (p: any) => p.id === quoteProduct.id,
              );
              const displayPrice = parseFloat(quoteProduct.offerPrice || "0");
              const productImage = product?.rfqProductDetails?.productImages?.[0]?.image;
              return (
                <div key={quoteProduct.id || index} className="border border-border rounded-lg p-4 bg-muted">
                  <div className="flex items-start gap-4">
                    {productImage && (
                      <Image
                        src={productImage}
                        alt={product?.rfqProductDetails?.productName || "Product"}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">
                        {product?.rfqProductDetails?.productName || "Product"}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("quantity")}: {quoteProduct.quantity || product?.quantity || 1}
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {currency.symbol}{displayPrice}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Alternative Products */}
      {rfqQuoteData.suggestedProducts?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
            {t("suggested_alternative_products") || "Suggested Alternative Products"}
          </h3>
          <div className="space-y-4">
            {rfqQuoteData.suggestedProducts.map((suggestedProduct: any, index: number) => {
              const displayPrice = parseFloat(suggestedProduct.offerPrice || "0");
              const productImage = suggestedProduct.productImage;
              return (
                <div key={suggestedProduct.id || index} className="border-2 border-info/20 rounded-lg p-4 bg-info/5">
                  <div className="flex items-start gap-4">
                    {productImage && validator.isURL(productImage) ? (
                      <Image
                        src={productImage}
                        alt={suggestedProduct.productName || "Product"}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">
                          {suggestedProduct.productName || "Product"}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-info/10 text-info text-xs font-medium">
                          {t("suggested") || "Suggested"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("quantity")}: {suggestedProduct.quantity || 1}
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {currency.symbol}{displayPrice}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback: use rfqQuoteDetails when quoteProducts is empty */}
      {rfqQuoteDetails?.rfqQuotesProducts?.length > 0 && !rfqQuoteData.quoteProducts?.length && (
        <div className="space-y-4">
          {rfqQuoteDetails.rfqQuotesProducts.map((product: any, index: number) => {
            const quoteProduct = rfqQuoteData?.quoteProducts?.find(
              (qp: any) => qp.id === product.id,
            );
            const displayPrice = parseFloat(
              quoteProduct?.offerPrice || product.offerPrice || "0",
            );
            const productImage = product?.rfqProductDetails?.productImages?.[0]?.image;
            return (
              <div key={product.id || index} className="border border-border rounded-lg p-4 bg-muted">
                <div className="flex items-start gap-4">
                  {productImage && (
                    <Image
                      src={productImage}
                      alt={product?.rfqProductDetails?.productName || "Product"}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">
                      {product?.rfqProductDetails?.productName || "Product"}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t("quantity")}: {quoteProduct?.quantity || product.quantity || 1}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {currency.symbol}{displayPrice}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default CheckoutRfqItems;
