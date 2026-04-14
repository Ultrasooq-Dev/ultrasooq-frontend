"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useClickOutside } from "use-events";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  useRfqCartListByUserId,
  useUpdateRfqCartWithLogin,
  useDeleteRfqCartItem,
} from "@/apis/queries/rfq.queries";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";

export function useRfqCart(
  haveAccessToken: boolean,
  meData: any,
  rfqProductsData: any,
) {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wrapperRef = useRef(null);

  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>();
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [quantity, setQuantity] = useState<number | undefined>();
  const [offerPriceFrom, setOfferPriceFrom] = useState<number | undefined>();
  const [offerPriceTo, setOfferPriceTo] = useState<number | undefined>();
  const [cartList, setCartList] = useState<any[]>([]);

  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const updateRfqCartWithLogin = useUpdateRfqCartWithLogin();
  const deleteRfqCartItem = useDeleteRfqCartItem();

  const [isClickedOutside] = useClickOutside([wrapperRef], (event) => {});

  const rfqCartListByUser = useRfqCartListByUserId(
    { page: 1, limit: 100 },
    haveAccessToken,
  );

  const memoizedRfqProducts = useMemo(() => {
    if (rfqProductsData?.data) {
      return (
        rfqProductsData.data.map((item: any) => ({
          ...item,
          isAddedToCart:
            item?.product_rfqCart?.length &&
            item?.product_rfqCart[0]?.quantity > 0,
          quantity:
            item?.product_rfqCart?.length &&
            item?.product_rfqCart[0]?.quantity,
        })) || []
      );
    }
    return [];
  }, [rfqProductsData?.data]);

  useEffect(() => {
    if (rfqCartListByUser.data?.data) {
      setCartList(rfqCartListByUser.data?.data?.map((item: any) => item) || []);
    }
  }, [rfqCartListByUser.data?.data]);

  useEffect(() => {
    if (isClickedOutside) {
      setSelectedProductId(undefined);
      setQuantity(undefined);
    }
  }, [isClickedOutside]);

  const handleToggleAddModal = () =>
    setIsAddToCartModalOpen(!isAddToCartModalOpen);

  const handleAddToCart = async (
    quantity: number,
    productId: number,
    actionType: "add" | "remove",
    offerPriceFrom?: number,
    offerPriceTo?: number,
    note?: string,
  ) => {
    const response = await updateRfqCartWithLogin.mutateAsync({
      productId,
      quantity,
      offerPriceFrom: offerPriceFrom || 0,
      offerPriceTo: offerPriceTo || 0,
      note: note || "",
    });

    if (response.status) {
      toast({
        title:
          actionType == "add"
            ? t("item_added_to_cart")
            : t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    }
  };

  const handleCartPage = () => router.push("/rfq-cart");

  const handleRemoveItemFromCart = async (rfqCartId: number) => {
    try {
      const response = await deleteRfqCartItem.mutateAsync({ rfqCartId });
      if (response.status) {
        toast({
          title: t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["rfq-cart-by-user"] });
        queryClient.invalidateQueries({ queryKey: ["rfq-products"] });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failed_to_remove_item"),
        variant: "danger",
      });
    }
  };

  const handleRFQCart = (
    quantity: number,
    productId: number,
    action: "add" | "remove",
    offerPriceFrom?: number,
    offerPriceTo?: number,
    note?: string,
  ) => {
    if (action === "remove" || quantity === 0 || !quantity) {
      handleAddToCart(0, productId, "remove", 0, 0, "");
    } else {
      handleToggleAddModal();
      setSelectedProductId(productId);
      setQuantity(quantity);
      setOfferPriceFrom(offerPriceFrom);
      setOfferPriceTo(offerPriceTo);
    }
  };

  const handleDeleteFromWishlist = async (productId: number) => {
    const response = await deleteFromWishlist.mutateAsync({ productId });
    if (response.status) {
      toast({
        title: t("item_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["rfq-products"] });
    } else {
      toast({
        title: t("item_not_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleAddToWishlist = async (
    productId: number,
    wishlistArr?: any[],
  ) => {
    const wishlistObject = wishlistArr?.find(
      (item) => item.userId === meData?.data?.id,
    );
    if (wishlistObject) {
      handleDeleteFromWishlist(wishlistObject?.productId);
      return;
    }

    const response = await addToWishlist.mutateAsync({ productId });
    if (response.status) {
      toast({
        title: t("item_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["rfq-products"] });
    } else {
      toast({
        title: response.message || t("item_not_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  return {
    // refs
    wrapperRef,
    // state
    viewType,
    setViewType,
    showCartDrawer,
    setShowCartDrawer,
    selectedProductId,
    setSelectedProductId,
    isAddToCartModalOpen,
    setIsAddToCartModalOpen,
    quantity,
    setQuantity,
    offerPriceFrom,
    offerPriceTo,
    cartList,
    // queries
    memoizedRfqProducts,
    updateRfqCartWithLogin,
    deleteRfqCartItem,
    // handlers
    handleToggleAddModal,
    handleAddToCart,
    handleCartPage,
    handleRemoveItemFromCart,
    handleRFQCart,
    handleAddToWishlist,
  };
}
