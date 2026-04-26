import {
  useAllBuyGroupProducts,
  useAllProducts,
} from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useCallback, useMemo } from "react";

export function useHomeProducts() {
  const me = useMe();

  const transformProductData = useCallback(
    (item: any, includeSold = false) => {
      let sold = 0;
      if (includeSold && item.orderProducts?.length) {
        item.orderProducts.forEach((product: any) => {
          sold += product?.orderQuantity || 0;
        });
      }

      return {
        id: item.id,
        productName: item?.productName || "-",
        productPrice: item?.productPrice || 0,
        offerPrice: item?.offerPrice || 0,
        productImage: item?.product_productPrice?.[0]
          ?.productPrice_productSellerImage?.length
          ? item?.product_productPrice?.[0]
              ?.productPrice_productSellerImage?.[0]?.image
          : item?.productImages?.[0]?.image,
        categoryName: item?.category?.name || "-",
        skuNo: item?.skuNo,
        brandName: item?.brand?.brandName || "-",
        productReview: item?.productReview || [],
        productWishlist: item?.product_wishlist || [],
        inWishlist: item?.product_wishlist?.find(
          (ele: any) => ele?.userId === me.data?.data?.id,
        ),
        shortDescription: item?.product_productShortDescription?.length
          ? item?.product_productShortDescription?.[0]?.shortDescription
          : "-",
        productProductPriceId: item?.product_productPrice?.[0]?.id,
        productProductPrice: item?.product_productPrice?.[0]?.offerPrice,
        consumerDiscount: item?.product_productPrice?.[0]?.consumerDiscount,
        askForPrice: item?.product_productPrice?.[0]?.askForPrice,
        productPrices: item?.product_productPrice,
        sold: includeSold ? sold : undefined,
      };
    },
    [me.data?.data?.id],
  );

  const buyGroupProductsQuery = useAllBuyGroupProducts({
    page: 1,
    limit: 4,
    sort: "desc",
  });

  const memoizedBuyGroupProducts = useMemo(() => {
    return (
      buyGroupProductsQuery?.data?.data?.map((item: any) =>
        transformProductData(item, true),
      ) || []
    );
  }, [buyGroupProductsQuery?.data?.data, transformProductData]);

  const homeDecorProductsQuery = useAllProducts({
    page: 1,
    limit: 4,
    sort: "desc",
    categoryIds: "228,214,195",
  });

  const memoizedHomeDecorProducts = useMemo(() => {
    return (
      homeDecorProductsQuery?.data?.data?.map((item: any) =>
        transformProductData(item),
      ) || []
    );
  }, [homeDecorProductsQuery?.data?.data, transformProductData]);

  const fashionBeautyProductsQuery = useAllProducts({
    page: 1,
    limit: 4,
    sort: "desc",
    categoryIds: "107,143,256,275,290",
  });

  const memoizedFashionBeautyProducts = useMemo(() => {
    return (
      fashionBeautyProductsQuery?.data?.data?.map((item: any) =>
        transformProductData(item),
      ) || []
    );
  }, [fashionBeautyProductsQuery?.data?.data, transformProductData]);

  const consumerElectronicsProductsQuery = useAllProducts({
    page: 1,
    limit: 4,
    sort: "desc",
    categoryIds: "13,43,74",
  });

  const memoizedConsumerElectronicsProducts = useMemo(() => {
    return (
      consumerElectronicsProductsQuery?.data?.data?.map((item: any) =>
        transformProductData(item),
      ) || []
    );
  }, [consumerElectronicsProductsQuery?.data?.data, transformProductData]);

  const allProductsForSectionsQuery = useAllProducts({
    page: 1,
    limit: 100,
    sort: "desc",
  });

  const memoizedTopRatedProducts = useMemo(() => {
    if (!allProductsForSectionsQuery?.data?.data) return [];
    const products = allProductsForSectionsQuery.data.data
      .map((item: any) => ({
        ...transformProductData(item),
        averageRating:
          item.productReview?.length > 0
            ? item.productReview.reduce(
                (acc: number, review: any) => acc + (review.rating || 0),
                0,
              ) / item.productReview.length
            : 0,
        reviewCount: item.productReview?.length || 0,
      }))
      .filter((item: any) => item.reviewCount >= 3 && item.averageRating >= 4)
      .sort((a: any, b: any) => b.averageRating - a.averageRating);
    return products.slice(0, 10);
  }, [allProductsForSectionsQuery?.data?.data, transformProductData]);

  const memoizedBestSellers = useMemo(() => {
    if (!buyGroupProductsQuery?.data?.data) return [];
    const products = buyGroupProductsQuery.data.data
      .map((item: any) => {
        let sold = 0;
        if (item.orderProducts?.length) {
          item.orderProducts.forEach((product: any) => {
            sold += product?.orderQuantity || 0;
          });
        }
        return { ...transformProductData(item, true), sold };
      })
      .filter((item: any) => item.sold > 0)
      .sort((a: any, b: any) => b.sold - a.sold);
    return products.slice(0, 10);
  }, [buyGroupProductsQuery?.data?.data, transformProductData]);

  const memoizedNewArrivals = useMemo(() => {
    if (!allProductsForSectionsQuery?.data?.data) return [];
    return allProductsForSectionsQuery.data.data
      .map((item: any) => transformProductData(item))
      .slice(0, 10);
  }, [allProductsForSectionsQuery?.data?.data, transformProductData]);

  const memoizedHotDeals = useMemo(() => {
    if (!allProductsForSectionsQuery?.data?.data) return [];
    const products = allProductsForSectionsQuery.data.data
      .map((item: any) => transformProductData(item))
      .filter(
        (item: any) => item.consumerDiscount && item.consumerDiscount > 0,
      )
      .sort(
        (a: any, b: any) =>
          (b.consumerDiscount || 0) - (a.consumerDiscount || 0),
      );
    return products.slice(0, 10);
  }, [allProductsForSectionsQuery?.data?.data, transformProductData]);

  const memoizedHighlyReviewed = useMemo(() => {
    if (!allProductsForSectionsQuery?.data?.data) return [];
    const products = allProductsForSectionsQuery.data.data
      .map((item: any) => ({
        ...transformProductData(item),
        reviewCount: item.productReview?.length || 0,
        averageRating:
          item.productReview?.length > 0
            ? item.productReview.reduce(
                (acc: number, review: any) => acc + (review.rating || 0),
                0,
              ) / item.productReview.length
            : 0,
      }))
      .filter((item: any) => item.reviewCount > 10)
      .sort((a: any, b: any) => b.reviewCount - a.reviewCount);
    return products.slice(0, 10);
  }, [allProductsForSectionsQuery?.data?.data, transformProductData]);

  return {
    memoizedBuyGroupProducts,
    memoizedHomeDecorProducts,
    memoizedFashionBeautyProducts,
    memoizedConsumerElectronicsProducts,
    memoizedTopRatedProducts,
    memoizedBestSellers,
    memoizedNewArrivals,
    memoizedHotDeals,
    memoizedHighlyReviewed,
  };
}
