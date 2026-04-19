import { useEffect, useMemo, useRef, useState } from "react";
import {
  useProductById,
  useOneWithProductPrice,
  useProductVariant,
  useTrackProductView,
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
import { useClickOutside } from "use-events";
import { getOrCreateDeviceId } from "@/utils/helper";

export function useProductPageState(
  searchParamsId: string,
  otherSellerId: string | null,
  otherProductId: string | null,
  sharedLinkId: string,
  haveAccessToken: boolean,
) {
  const deviceId = getOrCreateDeviceId() || "";
  const [productVariantTypes, setProductVariantTypes] = useState<string[]>();
  const [productVariants, setProductVariants] = useState<any[]>();
  const [selectedProductVariant, setSelectedProductVariant] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);
  const [globalQuantity, setGlobalQuantity] = useState(0);
  const confirmDialogRef = useRef(null);

  const handleConfirmDialog = () => setIsConfirmDialogOpen((v) => !v);

  const [isClickedOutsideConfirmDialog] = useClickOutside(
    [confirmDialogRef],
    () => {
      onCancelRemoveRef.current?.();
    },
  );
  // We expose a ref so the cancel callback can be injected after creation
  const onCancelRemoveRef = useRef<(() => void) | null>(null);

  const me = useMe();
  const getProductVariant = useProductVariant();
  const trackView = useTrackProductView();

  const productQueryById = useProductById(
    {
      productId: searchParamsId,
      userId: me.data?.data?.id,
      sharedLinkId,
    },
    !!searchParamsId && !otherSellerId && !otherProductId,
  );

  const productQueryByOtherSeller = useOneWithProductPrice(
    {
      productId: otherProductId ? Number(otherProductId) : 0,
      adminId: otherSellerId ? Number(otherSellerId) : 0,
    },
    !!otherProductId && !!otherSellerId,
  );

  const cartListByDeviceQuery = useCartListByDevice(
    { page: 1, limit: 100, deviceId },
    !haveAccessToken,
  );
  const cartListByUser = useCartListByUserId({ page: 1, limit: 100 }, haveAccessToken);

  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const deleteCartItem = useDeleteCartItem();
  const deleteServiceFromCart = useDeleteServiceFromCart();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();

  const productDetails = !otherSellerId
    ? productQueryById.data?.data
    : productQueryByOtherSeller.data?.data;
  const productInWishlist = !otherSellerId
    ? productQueryById.data?.inWishlist
    : productQueryByOtherSeller.data?.inWishlist;
  const otherSellerDetails = !otherSellerId
    ? productQueryById.data?.otherSeller
    : productQueryByOtherSeller.data?.otherSeller;

  const hasItemByUser = !!cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParamsId),
  );
  const hasItemByDevice = !!cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParamsId),
  );
  const getProductQuantityByUser = cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParamsId),
  )?.quantity;
  const getProductQuantityByDevice = cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParamsId),
  )?.quantity;
  const getProductVariantByUser = cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParamsId),
  )?.object;
  const getProductVariantByDevice = cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParamsId),
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

  const calculateTagIds = useMemo(
    () => productDetails?.productTags.map((item: any) => item.tagId).join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productDetails?.productTags?.length],
  );

  // Track product view
  useEffect(() => {
    if (productQueryById.data?.data?.id && !productQueryById.isLoading) {
      const payload: any = { productId: productQueryById.data.data.id };
      if (!haveAccessToken && deviceId) {
        payload.deviceId = deviceId;
      }
      trackView.mutate(payload);
    }
  }, [productQueryById.data?.data?.id, productQueryById.isLoading, haveAccessToken, deviceId]);

  // Fetch product variants
  useEffect(() => {
    const fetchProductVariant = async () => {
      const response = await getProductVariant.mutateAsync([
        productDetails?.product_productPrice?.[0]?.id,
      ]);
      const variants = response?.data?.[0]?.object || [];
      if (variants.length > 0) {
        let variantTypes = variants.map((item: any) => item.type);
        variantTypes = Array.from(new Set(variantTypes));
        setProductVariantTypes(variantTypes as string[]);
        setProductVariants(variants);
      }
    };
    if (!productQueryById?.isLoading) fetchProductVariant();
  }, [productQueryById?.data?.data]);

  // Sync quantity and variant from cart
  useEffect(() => {
    setGlobalQuantity(getProductQuantityByUser || getProductQuantityByDevice || 0);
    if (getProductVariantByDevice || getProductVariantByUser) {
      setSelectedProductVariant(getProductVariantByDevice || getProductVariantByUser);
    } else {
      setSelectedProductVariant(
        productVariantTypes?.map((variantType: string) =>
          productVariants?.find((variant: any) => variant.type == variantType),
        ),
      );
    }
  }, [
    cartListByUser.data?.data,
    cartListByDeviceQuery.data?.data,
    productVariants?.length,
  ]);

  return {
    deviceId,
    me,
    productQueryById,
    productQueryByOtherSeller,
    cartListByDeviceQuery,
    cartListByUser,
    updateCartWithLogin,
    updateCartByDevice,
    deleteCartItem,
    deleteServiceFromCart,
    addToWishlist,
    deleteFromWishlist,
    productDetails,
    productInWishlist,
    otherSellerDetails,
    hasItemByUser,
    hasItemByDevice,
    getProductQuantityByUser,
    getProductQuantityByDevice,
    memoizedCartList,
    calculateTagIds,
    productVariantTypes,
    productVariants,
    selectedProductVariant,
    setSelectedProductVariant,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    handleConfirmDialog,
    confirmDialogRef,
    isChatOpen,
    setIsChatOpen,
    isVisible,
    setIsVisible,
    globalQuantity,
    setGlobalQuantity,
    getProductVariant,
    onCancelRemoveRef,
    trackView,
  };
}
