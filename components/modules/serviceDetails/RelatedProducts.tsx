import React, { useEffect, useMemo, useState } from "react";
import { useProductsByService } from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useAddToWishList, useDeleteFromWishList } from "@/apis/queries/wishlist.queries";
import { toast } from "@/components/ui/use-toast";
import { TrendingProduct } from "@/utils/types/common.types";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import ProductCard from "../trending/ProductCard";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import { useAuth } from "@/context/AuthContext";

type RelatedProductsProps = {
    serviceId: number;
    serviceCategoryId: string;
    cartList: any[];
    serviceCartId?: number;
    isChildCart: boolean;
};

const RelatedProducts: React.FC<RelatedProductsProps> = ({
    serviceId,
    serviceCategoryId,
    cartList,
    serviceCartId,
    isChildCart,
}) => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const queryClient = useQueryClient();
    const me = useMe();
    const addToWishlist = useAddToWishList();
    const deleteFromWishlist = useDeleteFromWishList();
    const [haveAccessToken, setHaveAccessToken] = useState(false);
    const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(8);

    const productsQuery = useProductsByService(serviceId, {
        page,
        limit,
    });

    const memoizedProductList = useMemo(() => {
        return (
            productsQuery?.data?.data?.map((item: any) => ({
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
                consumerDiscountType: item?.product_productPrice?.[0]?.consumerDiscountType,
                vendorDiscount: item?.product_productPrice?.[0]?.vendorDiscount,
                vendorDiscountType: item?.product_productPrice?.[0]?.vendorDiscountType,
                askForPrice: item?.product_productPrice?.[0]?.askForPrice,
                productPrices: item?.product_productPrice,
            })) || []
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        productsQuery?.data?.data,
        productsQuery?.data?.data?.length,
        page,
        limit,
    ]);

    const handleDeleteFromWishlist = async (productId: number) => {
        const response = await deleteFromWishlist.mutateAsync({
            productId,
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
                    { productId: String(productId), userId: me.data?.data?.id },
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

    const handleAddToWishlist = async (
        productId: number,
        wishlistArr?: any[],
    ) => {
        const wishlistObject = wishlistArr?.find(
            (item) => item.userId === me.data?.data?.id,
        );

        if (wishlistObject) {
            handleDeleteFromWishlist(wishlistObject?.productId);
            return;
        }

        const response = await addToWishlist.mutateAsync({
            productId,
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
                    { productId: String(productId), userId: me.data?.data?.id },
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

    useEffect(() => {
        if (accessToken) {
          setHaveAccessToken(true);
        } else {
          setHaveAccessToken(false);
        }
      }, [accessToken]);

    return (
        <>
            <div className="product-list-s1">
                {memoizedProductList.map((item: TrendingProduct) => {
                    const cartItem = cartList?.find((el: any) => el.productId == item.id);
                    let relatedCart: any = null;
                    if (cartItem) {
                        relatedCart = cartList
                            ?.filter((c: any) => c.serviceId && c.cartProductServices?.length)
                            .find((c: any) => {
                                return !!c.cartProductServices
                                    .find((r: any) => r.relatedCartType == 'PRODUCT' && r.productId == item.id);
                            });
                    }
                    return (
                        <ProductCard
                            key={item.id}
                            // productVariants={
                            //     productVariants.find((variant: any) => variant.productId == item.id)?.object || []
                            // }
                            item={item}
                            onWishlist={() =>
                                handleAddToWishlist(item.id, item?.productWishlist)
                            }
                            inWishlist={item?.inWishlist}
                            haveAccessToken={haveAccessToken}
                            isInteractive
                            productQuantity={cartItem?.quantity || 0}
                            productVariant={cartItem?.object}
                            cartId={cartItem?.id}
                            isAddedToCart={cartItem ? true : false}
                            serviceId={!isChildCart ? serviceId : undefined}
                            serviceCartId={!isChildCart ? serviceCartId : undefined}
                            relatedCart={relatedCart}
                        />
                    );
                })}
            </div>

            {!memoizedProductList.length && !productsQuery.isLoading ? (
                <p className="text-center text-sm font-medium mt-10" dir={langDir} translate="no">
                    {t("no_data_found")}
                </p>
            ) : null}
        </>
    );
};

export default RelatedProducts;