/**
 * useItemDetailSearch — product search + recommendations for ItemDetailPanel.
 * Handles unified search, browse-mode (chips only), OR-filtering, dedup by
 * model name, and similar-product recommendations.
 */
import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import http from "@/apis/http";
import { getApiUrl } from "@/config/api";
import { useTrackProductSearch } from "@/apis/queries/product.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import { FILTER_CHIPS } from "./cards/FilterChipBar";
import {
  mapToProductModels,
  matchesChip,
  buildRecommendedProducts,
} from "./itemDetailProductMapper";

const PRODUCTS_PER_PAGE = 5;

interface UseItemDetailSearchProps {
  searchTerm?: string;
  searchPage: number;
  chipFilterParams: Record<string, any>;
  activeChipDefs: typeof FILTER_CHIPS;
  hasActiveChips: boolean;
}

export function useItemDetailSearch({
  searchTerm,
  searchPage,
  chipFilterParams,
  activeChipDefs,
  hasActiveChips,
}: UseItemDetailSearchProps) {
  const trackSearch = useTrackProductSearch();

  const productSearchQuery = useQuery({
    queryKey: [
      "product-hub-search",
      searchTerm,
      searchPage,
      JSON.stringify(chipFilterParams),
    ],
    queryFn: async () => {
      const cleanTerm = searchTerm?.trim() || "";
      const hasFilters = Object.keys(chipFilterParams).length > 0;
      if (!cleanTerm && !hasFilters) return { data: [], totalCount: 0 };

      // Browse mode: chips only, no search term
      if (!cleanTerm && hasFilters) {
        try {
          const needsAllTypes = activeChipDefs.some(
            (c) =>
              c.key === "buygroup" ||
              c.key === "wholesale" ||
              c.key === "discount" ||
              c.key === "service" ||
              c.key === "vendor_store"
          );
          const res = await http.get(`${getApiUrl()}/product/getAllProduct`, {
            params: {
              page: 1,
              limit: 200,
              ...(needsAllTypes ? { allSellTypes: "true" } : {}),
            },
          });
          const allProducts = res.data?.data ?? [];
          const filtered =
            activeChipDefs.length > 0
              ? allProducts.filter((p: any) =>
                  activeChipDefs.some((chip) => matchesChip(p, chip))
                )
              : allProducts;
          filtered.sort(
            (a: any, b: any) =>
              (b.productViewCount ?? 0) - (a.productViewCount ?? 0)
          );
          const page = filtered.slice(
            (searchPage - 1) * PRODUCTS_PER_PAGE,
            searchPage * PRODUCTS_PER_PAGE
          );
          return { data: page, totalCount: filtered.length };
        } catch (err: any) {
          console.error("[Browse] getAllProduct failed:", err?.message);
          return { data: [], totalCount: 0 };
        }
      }

      // Search mode: term + optional chip filters
      const singleChipParams =
        activeChipDefs.length === 1 ? activeChipDefs[0].params : {};
      let searchData: any[] = [];
      let searchTotal = 0;

      try {
        const res = await http.get(`${getApiUrl()}/product/search/unified`, {
          params: {
            q: cleanTerm,
            page: searchPage,
            limit: hasActiveChips ? 50 : PRODUCTS_PER_PAGE,
            ...singleChipParams,
          },
        });
        searchData = res.data?.data ?? [];
        searchTotal = res.data?.totalCount ?? 0;
      } catch (err: any) {
        console.error(
          "[Search] Unified failed:",
          err?.response?.status,
          err?.message
        );
        try {
          const res = await http.get(`${getApiUrl()}/product/getAllProduct`, {
            params: {
              page: searchPage,
              limit: hasActiveChips ? 50 : PRODUCTS_PER_PAGE,
              term: cleanTerm,
            },
          });
          searchData = res.data?.data ?? [];
          searchTotal = res.data?.totalCount ?? 0;
        } catch {}
      }

      if (activeChipDefs.length > 1 && searchData.length > 0) {
        searchData = searchData.filter((p: any) =>
          activeChipDefs.some((chip) => matchesChip(p, chip))
        );
        searchTotal = searchData.length;
      }

      if (searchData.length > 0) {
        return { data: searchData.slice(0, PRODUCTS_PER_PAGE), totalCount: searchTotal };
      }
      return { data: [], totalCount: 0 };
    },
    enabled: (!!searchTerm && searchTerm.length >= 1) || hasActiveChips,
    staleTime: 30_000,
  });

  // Track search when results arrive
  useEffect(() => {
    if (
      searchTerm &&
      searchTerm.trim().length >= 1 &&
      productSearchQuery.isSuccess
    ) {
      trackSearch.mutate({
        searchTerm: searchTerm.trim(),
        deviceId: getOrCreateDeviceId() || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, productSearchQuery.isSuccess]);

  const totalProductCount = productSearchQuery?.data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalProductCount / PRODUCTS_PER_PAGE);

  const realProducts = useMemo(
    () => mapToProductModels(productSearchQuery?.data?.data ?? []),
    [productSearchQuery?.data]
  );

  // Recommendations: similar products when few main results
  const topProduct = (realProducts ?? [])[0];
  const needsRecommendations = (realProducts ?? []).length < 5 && !!topProduct;
  const similarSearchTerm = useMemo(() => {
    if (!topProduct?.name) return "";
    const words = topProduct.name
      .split(/\s+/)
      .filter((w: string) => w.length > 3);
    return words.slice(0, 3).join(" ");
  }, [topProduct?.name]);

  const recommendedQuery = useQuery({
    queryKey: ["product-hub-similar", similarSearchTerm],
    queryFn: async () => {
      if (!similarSearchTerm) return { data: [], totalCount: 0 };
      try {
        const res = await http.get(`${getApiUrl()}/product/search/unified`, {
          params: { q: similarSearchTerm, page: 1, limit: 10 },
        });
        return {
          data: res.data?.data ?? [],
          totalCount: res.data?.totalCount ?? 0,
        };
      } catch {
        return { data: [], totalCount: 0 };
      }
    },
    enabled: needsRecommendations && similarSearchTerm.length > 3,
    staleTime: 60_000,
  });

  const recommendedProducts = useMemo(
    () => buildRecommendedProducts(recommendedQuery?.data?.data ?? [], realProducts),
    [recommendedQuery?.data, realProducts]
  );

  return {
    productSearchQuery,
    realProducts,
    totalProductCount,
    totalPages,
    recommendedProducts,
    PRODUCTS_PER_PAGE,
  };
}
