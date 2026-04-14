/**
 * useItemDetailPricing — computes discounted pricing for ProductDetailView,
 * mirroring the logic in ProductDescriptionCard exactly.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import http from "@/apis/http";
import { getApiUrl } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import type { DetailPricing, PricingInfo } from "./itemDetailTypes";

interface UseItemDetailPricingProps {
  viewingProductId: number | null;
  locale: string;
}

export function useItemDetailPricing({
  viewingProductId,
  locale,
}: UseItemDetailPricingProps) {
  const isAr = locale === "ar";
  const { user, currency } = useAuth();
  const currentAccount = useCurrentAccount();
  const vendorBusinessCategoryIds = useVendorBusinessCategories();
  const currentTradeRole =
    currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;

  const productDetailQuery = useQuery({
    queryKey: ["product-detail", viewingProductId],
    queryFn: async () => {
      if (!viewingProductId) return null;
      try {
        const res = await http.get(`${getApiUrl()}/product/findOne`, {
          params: { productId: viewingProductId },
        });
        return res.data?.data ?? res.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!viewingProductId,
    staleTime: 60_000,
  });

  const [buygroupTimeLeft, setBuygroupTimeLeft] = useState<string | null>(null);

  // Buygroup countdown timer
  useEffect(() => {
    const detail = productDetailQuery?.data;
    const pp = detail?.product_productPrice?.[0];
    if (!pp || pp.sellType !== "BUYGROUP" || !pp.dateClose) {
      setBuygroupTimeLeft(null);
      return;
    }
    const getTs = (ds: string, ts?: string) => {
      const d = new Date(ds);
      if (ts) {
        const [h, m] = ts.split(":").map(Number);
        d.setHours(h || 0, m || 0, 0, 0);
      }
      return d.getTime();
    };
    const startTs = pp.dateOpen ? getTs(pp.dateOpen, pp.startTime) : 0;
    const endTs = getTs(pp.dateClose, pp.endTime);
    const fmt = (ms: number) => {
      const s = Math.floor(ms / 1000);
      const d = Math.floor(s / 86400);
      return `${d} ${isAr ? "يوم" : "Days"}; ${String(Math.floor((s % 86400) / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    };
    const tick = () => {
      const now = Date.now();
      if (startTs && now < startTs) {
        setBuygroupTimeLeft(isAr ? "لم يبدأ بعد" : "Not Started");
        return;
      }
      const ms = endTs - now;
      if (ms <= 0) {
        setBuygroupTimeLeft(isAr ? "انتهى" : "Expired");
        return;
      }
      setBuygroupTimeLeft(fmt(ms));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [productDetailQuery?.data, isAr]);

  const computeDetailPricing = (): DetailPricing => {
    const detail = productDetailQuery.data;
    const priceEntry = detail?.product_productPrice?.[0];
    const ppEntry = priceEntry || {};

    const pricingInfo: PricingInfo = {
      consumerDiscount: ppEntry.consumerDiscount ?? 0,
      consumerDiscountType: ppEntry.consumerDiscountType ?? null,
      vendorDiscount: ppEntry.vendorDiscount ?? 0,
      vendorDiscountType: ppEntry.vendorDiscountType ?? null,
      consumerType: ppEntry.consumerType ?? "CONSUMER",
      minQuantity:
        ppEntry.minQuantityPerCustomer ?? ppEntry.minQuantity ?? 1,
      maxQuantity:
        ppEntry.maxQuantityPerCustomer ?? ppEntry.maxQuantity ?? null,
      minOrder: ppEntry.minQuantity ?? 1,
      maxOrder: ppEntry.maxQuantity ?? null,
      askForPrice: ppEntry.askForPrice === "true",
      sellType: ppEntry.sellType ?? "NORMALSELL",
      enableChat: ppEntry.enableChat ?? false,
      dateOpen: ppEntry.dateOpen ?? null,
      dateClose: ppEntry.dateClose ?? null,
      startTime: ppEntry.startTime ?? null,
      endTime: ppEntry.endTime ?? null,
      minCustomer: ppEntry.minCustomer ?? null,
      maxCustomer: ppEntry.maxCustomer ?? null,
    };

    const categoryId = detail?.categoryId;
    const categoryLocation = detail?.category?.categoryLocation;

    const calculateDiscountedPrice = () => {
      const price = Number(
        ppEntry.productPrice ?? detail?.productPrice ?? 0
      );
      const offerPriceValue = Number(
        ppEntry.offerPrice ?? detail?.offerPrice ?? 0
      );
      if (offerPriceValue > 0 && offerPriceValue !== price)
        return offerPriceValue;

      const rawConsumerType = pricingInfo.consumerType || "CONSUMER";
      const productConsumerType =
        typeof rawConsumerType === "string"
          ? rawConsumerType.toUpperCase().trim()
          : "CONSUMER";
      const isVendorType =
        productConsumerType === "VENDOR" ||
        productConsumerType === "VENDORS";
      const isConsumerType = productConsumerType === "CONSUMER";
      const isEveryoneType = productConsumerType === "EVERYONE";

      const isCategoryMatch = checkCategoryConnection(
        vendorBusinessCategoryIds,
        categoryId || 0,
        categoryLocation,
        []
      );

      let discount = pricingInfo.consumerDiscount || 0;
      let discountType = pricingInfo.consumerDiscountType;

      if (currentTradeRole && currentTradeRole !== "BUYER") {
        if (isCategoryMatch) {
          if (pricingInfo.vendorDiscount > 0) {
            discount = pricingInfo.vendorDiscount;
            discountType = pricingInfo.vendorDiscountType;
          } else {
            discount = 0;
          }
        } else {
          if (isEveryoneType) {
            discount = pricingInfo.consumerDiscount || 0;
            discountType = pricingInfo.consumerDiscountType;
          } else {
            discount = 0;
          }
        }
      } else {
        if (isConsumerType || isEveryoneType) {
          discount = pricingInfo.consumerDiscount || 0;
          discountType = pricingInfo.consumerDiscountType;
        } else {
          discount = 0;
        }
      }

      if (discount > 0 && discountType) {
        if (discountType === "PERCENTAGE")
          return Number((price - (price * discount) / 100).toFixed(2));
        if (discountType === "FLAT")
          return Number((price - discount).toFixed(2));
      }
      return price;
    };

    const calculatedPrice = calculateDiscountedPrice();
    const originalPrice = Number(
      ppEntry.productPrice ?? detail?.productPrice ?? 0
    );
    const hasCalcDiscount =
      originalPrice > calculatedPrice && calculatedPrice > 0;
    const calcDiscountPct = hasCalcDiscount
      ? Math.round((1 - calculatedPrice / originalPrice) * 100)
      : 0;

    return {
      pricingInfo,
      calculatedPrice,
      originalPrice,
      hasCalcDiscount,
      calcDiscountPct,
    };
  };

  const currencySymbol = currency?.symbol || "OMR ";

  return {
    productDetailQuery,
    buygroupTimeLeft,
    computeDetailPricing,
    currencySymbol,
  };
}
