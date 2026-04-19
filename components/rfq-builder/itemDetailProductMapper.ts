/**
 * itemDetailProductMapper — pure helpers for mapping raw API product data
 * into normalized MappedProduct models used by ItemDetailPanel.
 */
import type { MappedProduct } from "./itemDetailTypes";

/** Maps a raw API product array into deduplicated MappedProduct models grouped by name. */
export function mapToProductModels(data: any[]): MappedProduct[] | null {
  if (!Array.isArray(data) || data.length === 0) return null;

  const modelMap = new Map<
    string,
    {
      id: number;
      name: string;
      minPrice: number;
      maxPrice: number;
      sellers: number;
      bestRating: number;
      totalReviews: number;
      allIds: number[];
    }
  >();

  for (const p of data) {
    const name = (p.productName ?? p.name ?? `Product #${p.id}`).trim();
    const key = name.substring(0, 80).toLowerCase();
    const price = Number(p.offerPrice ?? p.productPrice ?? 0);

    if (modelMap.has(key)) {
      const model = modelMap.get(key)!;
      model.minPrice = Math.min(model.minPrice, price);
      model.maxPrice = Math.max(model.maxPrice, price);
      model.sellers++;
      model.bestRating = Math.max(model.bestRating, p.rating ?? 4.0);
      model.totalReviews += p.reviewCount ?? 0;
      model.allIds.push(p.id);
    } else {
      modelMap.set(key, {
        id: p.id,
        name,
        minPrice: price,
        maxPrice: price,
        sellers: 1,
        bestRating: p.rating ?? 4.0,
        totalReviews: p.reviewCount ?? 0,
        allIds: [p.id],
      });
    }
  }

  return Array.from(modelMap.values()).map((m) => {
    const rawProduct = data.find((p: any) => p.id === m.id);
    const pp = rawProduct?.product_productPrice?.[0];
    return {
      id: m.id,
      name: m.name,
      price: m.minPrice,
      originalPrice: Number(
        pp?.productPrice ?? rawProduct?.productPrice ?? m.minPrice
      ),
      priceRange:
        m.minPrice !== m.maxPrice ? `${m.minPrice} - ${m.maxPrice}` : null,
      rating: m.bestRating,
      reviews: m.totalReviews,
      seller: m.sellers > 1 ? `${m.sellers} sellers` : "1 seller",
      delivery: pp?.deliveryAfter ? `${pp.deliveryAfter} days` : "3-5 days",
      inStock: (pp?.stock ?? 0) > 0,
      stock: pp?.stock ?? 0,
      specs: [] as string[][],
      sellersCount: m.sellers,
      allIds: m.allIds,
      sellType: pp?.sellType ?? "NORMALSELL",
      isBuygroup: pp?.sellType === "BUYGROUP",
      dateOpen: pp?.dateOpen ?? null,
      dateClose: pp?.dateClose ?? null,
      startTime: pp?.startTime ?? null,
      endTime: pp?.endTime ?? null,
      minCustomer: pp?.minCustomer ?? null,
      maxCustomer: pp?.maxCustomer ?? null,
      sold: 0,
      enableChat: pp?.enableChat === true,
      isCustomProduct:
        pp?.isCustomProduct === "true" || pp?.isCustomProduct === true,
      consumerType: pp?.consumerType ?? "CONSUMER",
      image: rawProduct?.productImages?.[0]?.image ?? null,
    };
  });
}

/** Checks if a raw product matches a single filter chip's params. */
export function matchesChip(
  p: any,
  chip: { params: Record<string, any>; key: string }
) {
  const cp = chip.params;
  const prices: any[] = p.product_productPrice ?? [];
  if (cp.productType && p.productType !== cp.productType) return false;
  if (cp.sellType) {
    const hasSellType = prices.some(
      (pp: any) =>
        pp.sellType === cp.sellType && !pp.deletedAt && pp.status === "ACTIVE"
    );
    if (!hasSellType) return false;
  }
  if (cp.hasDiscount === "true") {
    const hasDiscount =
      prices.some(
        (pp: any) =>
          Number(pp.offerPrice) > 0 &&
          Number(pp.offerPrice) < Number(pp.productPrice)
      ) ||
      (Number(p.offerPrice) > 0 &&
        Number(p.offerPrice) < Number(p.productPrice));
    if (!hasDiscount) return false;
  }
  if (cp.isCustomProduct === "true") {
    const isCustom =
      prices.some(
        (pp: any) =>
          pp.isCustomProduct === "true" || pp.isCustomProduct === true
      ) || p.isCustomProduct === true;
    if (!isCustom) return false;
  }
  if (Object.keys(cp).length === 0) return false;
  return true;
}

/** Builds deduplicated recommended products from raw API items,
 *  excluding products already in the main results. */
export function buildRecommendedProducts(
  items: any[],
  realProducts: MappedProduct[] | null
): any[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const existingNames = new Set(
    (realProducts ?? []).map((p: any) =>
      (p.name || "").substring(0, 80).toLowerCase()
    )
  );
  const existingIds = new Set((realProducts ?? []).map((p: any) => p.id));
  const modelMap = new Map<string, any>();
  for (const p of items) {
    const name = (p.productName ?? p.name ?? "").trim();
    const key = name.substring(0, 80).toLowerCase();
    if (existingNames.has(key) || existingIds.has(p.id)) continue;
    if (modelMap.has(key)) {
      modelMap.get(key).sellers++;
    } else {
      modelMap.set(key, {
        id: p.id,
        name,
        price: Number(p.offerPrice ?? p.productPrice ?? 0),
        rating: p.rating ?? 4.0,
        reviews: p.reviewCount ?? 0,
        seller: "1 seller",
        sellers: 1,
        delivery: "3-5 days",
        inStock: true,
        stock: 50,
        specs: [] as string[][],
        isRecommended: true,
      });
    }
  }
  return Array.from(modelMap.values())
    .map((m) => ({
      ...m,
      seller: m.sellers > 1 ? `${m.sellers} sellers` : "1 seller",
      sellersCount: m.sellers,
    }))
    .slice(0, 6);
}
