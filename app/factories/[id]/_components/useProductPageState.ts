"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useProductById,
  useOneWithProductPrice,
  useProductVariant,
} from "@/apis/queries/product.queries";
import {
  useCartListByDevice,
  useCartListByUserId,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
  useDeleteCartItem,
  useDeleteServiceFromCart,
} from "@/apis/queries/cart.queries";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId } from "@/utils/helper";
import { useClickOutside } from "use-events";

export function useProductPageState() {
  const queryClient = useQueryClient();
  const searchParams = useParams();
  const searchQuery = useSearchParams();
  const router = useRouter();
  const deviceId = getOrCreateDeviceId() || "";
  const [activeTab, setActiveTab] = useState("description");
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const type = searchQuery?.get("type");
  const otherSellerId = searchQuery?.get("sellerId");
  const otherProductId = searchQuery?.get("productId");
  const sharedLinkId = searchQuery?.get("sharedLinkId") || "";
  const [isShareLinkProcessed, setIsShareLinkProcessed] = useState<boolean>(false);
  const [productVariantTypes, setProductVariantTypes] = useState<string[]>();
  const [productVariants, setProductVariants] = useState<any[]>();
  const [selectedProductVariant, setSelectedProductVariant] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const handleConfirmDialog = () => setIsConfirmDialogOpen(!isConfirmDialogOpen);
  const confirmDialogRef = useRef(null);
  const [isClickedOutsideConfirmDialog] = useClickOutside(
    [confirmDialogRef],
    () => { onCancelRemove(); },
  );
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const handleCustomizeDialog = () => setIsCustomizeDialogOpen(!isCustomizeDialogOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [globalQuantity, setGlobalQuantity] = useState(0);

  const me = useMe();
  const productQueryById = useProductById(
    {
      productId: searchParams?.id ? (searchParams?.id as string) : "",
      userId: me.data?.data?.id,
      sharedLinkId: sharedLinkId,
    },
    !!searchParams?.id && !otherSellerId && !otherProductId,
  );
  const getProductVariant = useProductVariant();
  const cartListByDeviceQuery = useCartListByDevice(
    { page: 1, limit: 100, deviceId },
    !haveAccessToken,
  );
  const cartListByUser = useCartListByUserId(
    { page: 1, limit: 100 },
    haveAccessToken,
  );
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const productQueryByOtherSeller = useOneWithProductPrice(
    {
      productId: otherProductId ? Number(otherProductId) : 0,
      adminId: otherSellerId ? Number(otherSellerId) : 0,
    },
    !!otherProductId && !!otherSellerId,
  );
  const deleteCartItem = useDeleteCartItem();
  const deleteServiceFromCart = useDeleteServiceFromCart();

  const hasItemByUser = !!cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  );
  const hasItemByDevice = !!cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  );
  const getProductQuantityByUser = cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.quantity;
  const getProductQuantityByDevice = cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.quantity;
  const getProductVariantByUser = cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.object;
  const getProductVariantByDevice = cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.object;

  const memoizedCartList = useMemo(() => {
    if (cartListByUser.data?.data) {
      setIsVisible(true);
      return cartListByUser.data?.data || [];
    } else if (cartListByDeviceQuery.data?.data) {
      return cartListByDeviceQuery.data?.data || [];
    }
    return [];
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

  const productDetails = !otherSellerId
    ? productQueryById.data?.data
    : productQueryByOtherSeller.data?.data;
  const productInWishlist = !otherSellerId
    ? productQueryById.data?.inWishlist
    : productQueryByOtherSeller.data?.inWishlist;
  const otherSellerDetails = !otherSellerId
    ? productQueryById.data?.otherSeller
    : productQueryByOtherSeller.data?.otherSeller;

  const calculateTagIds = useMemo(
    () => productDetails?.productTags?.map((item: any) => item.tagId).join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productDetails?.productTags?.length],
  );

  const handleProductUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["product-by-id"] });
  };

  useEffect(() => {
    const fetchProductVariant = async () => {
      const response = await getProductVariant.mutateAsync([
        productDetails?.product_productPrice?.[0]?.id,
      ]);
      const variants = response?.data?.[0]?.object || [];
      if (variants.length > 0) {
        let variantTypes = variants.map((item: any) => item.type);
        variantTypes = Array.from(new Set(variantTypes));
        setProductVariantTypes(variantTypes);
        setProductVariants(variants);
      }
    };
    if (!productQueryById?.isLoading) fetchProductVariant();
  }, [productQueryById?.data?.data]);

  useEffect(() => {
    if (type) setActiveTab(type);
  }, [type]);

  useEffect(() => {
    if (accessToken) {
      setHaveAccessToken(true);
    } else {
      setHaveAccessToken(false);
    }
  }, [accessToken]);

  useEffect(() => {}, []);

  function onCancelRemove() {
    setGlobalQuantity(getProductQuantityByDevice || getProductQuantityByUser);
    setIsConfirmDialogOpen(false);
  }

  return {
    // routing / params
    searchParams,
    router,
    queryClient,
    // auth
    haveAccessToken,
    deviceId,
    me,
    // product data
    productDetails,
    productInWishlist,
    otherSellerDetails,
    otherSellerId,
    otherProductId,
    productQueryById,
    productQueryByOtherSeller,
    calculateTagIds,
    // variants
    productVariantTypes,
    productVariants,
    selectedProductVariant,
    setSelectedProductVariant,
    // cart data
    cartListByUser,
    cartListByDeviceQuery,
    memoizedCartList,
    hasItemByUser,
    hasItemByDevice,
    getProductQuantityByUser,
    getProductQuantityByDevice,
    getProductVariantByUser,
    getProductVariantByDevice,
    // cart mutations
    updateCartWithLogin,
    updateCartByDevice,
    deleteCartItem,
    deleteServiceFromCart,
    addToWishlist,
    deleteFromWishlist,
    // quantity
    globalQuantity,
    setGlobalQuantity,
    // visibility
    isVisible,
    setIsVisible,
    // tabs
    activeTab,
    setActiveTab,
    // dialogs
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    handleConfirmDialog,
    confirmDialogRef,
    isCustomizeDialogOpen,
    setIsCustomizeDialogOpen,
    handleCustomizeDialog,
    // share link
    sharedLinkId,
    isShareLinkProcessed,
    setIsShareLinkProcessed,
    // helpers
    handleProductUpdateSuccess,
    onCancelRemove,
    productQueryById_data_generatedLinkDetail: productQueryById?.data?.generatedLinkDetail,
  };
}
