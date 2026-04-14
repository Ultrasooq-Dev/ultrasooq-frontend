/**
 * useItemDetailBuy — fetches full product detail and maps ALL seller price
 * entries into BuyListing cards for the Buy/Customize tab.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import http from "@/apis/http";
import { getApiUrl } from "@/config/api";
import type { BuyListing } from "./itemDetailTypes";

interface UseItemDetailBuyProps {
  selectedProductId: number | null;
  activeTab: string;
}

export function useItemDetailBuy({
  selectedProductId,
  activeTab,
}: UseItemDetailBuyProps) {
  const buyDetailQuery = useQuery({
    queryKey: ["product-buy-detail", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      try {
        const res = await http.get(`${getApiUrl()}/product/findOne`, {
          params: { productId: selectedProductId },
        });
        return res.data?.data ?? res.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!selectedProductId && activeTab === "buynow",
    staleTime: 60_000,
  });

  // Keep old name for compatibility
  const buySearchQuery = {
    isLoading: buyDetailQuery.isLoading,
    data: buyDetailQuery.data,
  };

  const buyListings = useMemo<BuyListing[]>(() => {
    const detail = buyDetailQuery.data;
    if (!detail) return [];
    const priceEntries = detail.product_productPrice ?? [];
    if (priceEntries.length === 0) return [];

    return priceEntries
      .filter((pp: any) => !pp.deletedAt && pp.status !== "DELETE")
      .map((pp: any) => {
        const admin = pp.adminDetail;
        const sellerName =
          admin?.companyName ||
          admin?.accountName ||
          (admin?.firstName
            ? `${admin.firstName} ${admin.lastName || ""}`.trim()
            : null) ||
          "Seller";
        return {
          id: `${detail.id}-${pp.id}`,
          productId: detail.id,
          priceId: pp.id,
          name: detail.productName ?? "Product",
          seller: sellerName,
          sellerAvatar: admin?.profilePicture || null,
          price: Number(
            pp.offerPrice ?? pp.productPrice ?? detail.offerPrice ?? 0
          ),
          originalPrice: Number(
            pp.productPrice ?? detail.productPrice ?? 0
          ),
          rating: detail.averageRating ?? 4.0,
          reviews: detail.productReview?.length ?? 0,
          stock: pp.stock ?? 0,
          delivery: pp.deliveryAfter
            ? `${pp.deliveryAfter} days`
            : "3-5 days",
          inStock: (pp.stock ?? 0) > 0,
          sellType: pp.sellType ?? "NORMALSELL",
          condition: pp.productCondition ?? "New",
          brand: detail.brand?.brandName ?? "",
          category: detail.category?.name ?? "",
          description:
            detail.description ?? detail.shortDescription ?? "",
          minOrder: pp.minOrder ?? 1,
          warranty: pp.warranty ?? "",
          enableChat: pp.enableChat === true,
          isCustomProduct:
            pp.isCustomProduct === "true" || pp.isCustomProduct === true,
          dateOpen: pp.dateOpen ?? null,
          dateClose: pp.dateClose ?? null,
          startTime: pp.startTime ?? null,
          endTime: pp.endTime ?? null,
          minCustomer: pp.minCustomer ?? null,
          maxCustomer: pp.maxCustomer ?? null,
        };
      });
  }, [buyDetailQuery.data]);

  return { buyDetailQuery, buySearchQuery, buyListings };
}
