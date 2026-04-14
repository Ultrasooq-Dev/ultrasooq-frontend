"use client";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface UseWishlistHandlersParams {
  searchParams: any;
  queryClient: any;
  me: any;
  productInWishlist: any;
  addToWishlist: any;
  deleteFromWishlist: any;
  // shared-link params
  productDetails: any;
  memoizedCartList: any[];
  cartListByUser: any;
  cartListByDeviceQuery: any;
  isShareLinkProcessed: boolean;
  setIsShareLinkProcessed: (v: boolean) => void;
  productQueryById_data_generatedLinkDetail: any;
  handleRemoveItemFromCart: (cartId: number) => Promise<void>;
  handleAddToCart: (
    quantity: number,
    actionType: "add" | "remove",
    productVariant?: any,
  ) => Promise<any>;
}

export function useWishlistHandlers({
  searchParams,
  queryClient,
  me,
  productInWishlist,
  addToWishlist,
  deleteFromWishlist,
  productDetails,
  memoizedCartList,
  cartListByUser,
  cartListByDeviceQuery,
  isShareLinkProcessed,
  setIsShareLinkProcessed,
  productQueryById_data_generatedLinkDetail,
  handleRemoveItemFromCart,
  handleAddToCart,
}: UseWishlistHandlersParams) {
  const t = useTranslations();
  const { toast } = useToast();

  const handleDeleteFromWishlist = async () => {
    const response = await deleteFromWishlist.mutateAsync({
      productId: Number(searchParams?.id),
    });
    if (response.status) {
      toast({
        title: t("item_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [
          "product-by-id",
          { productId: searchParams?.id, userId: me.data?.data?.id },
        ],
      });
    } else {
      toast({
        title: t("item_not_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleAddToWishlist = async () => {
    if (!!productInWishlist) {
      handleDeleteFromWishlist();
      return;
    }
    const response = await addToWishlist.mutateAsync({
      productId: Number(searchParams?.id),
    });
    if (response.status) {
      toast({
        title: t("item_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [
          "product-by-id",
          { productId: searchParams?.id, userId: me.data?.data?.id },
        ],
      });
    } else {
      toast({
        title: response.message || t("item_not_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  const addToCartFromSharedLink = async () => {
    if (isShareLinkProcessed) return;
    if (
      productQueryById_data_generatedLinkDetail &&
      !cartListByUser?.isLoading &&
      !cartListByDeviceQuery?.isLoading
    ) {
      const item = memoizedCartList.find(
        (item: any) => item.productId == Number(searchParams?.id || ""),
      );
      if (
        !item ||
        (item && item.sharedLinkId != productQueryById_data_generatedLinkDetail.id)
      ) {
        if (item) {
          await handleRemoveItemFromCart(item.id);
        }
        const minQuantity = productDetails?.product_productPrice?.length
          ? productDetails.product_productPrice[0]?.minQuantityPerCustomer
          : null;
        const quantity = item?.quantity || minQuantity || 1;
        handleAddToCart(quantity, "add");
        setIsShareLinkProcessed(true);
      }
    }
  };

  useEffect(() => {
    addToCartFromSharedLink();
  }, [
    productQueryById_data_generatedLinkDetail,
    memoizedCartList.length,
    cartListByDeviceQuery?.isLoading,
    cartListByUser?.isLoading,
  ]);

  return { handleAddToWishlist };
}
