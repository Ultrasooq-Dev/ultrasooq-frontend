import React, { useEffect, useMemo, useState } from "react";
import { useAllProducts } from "@/apis/queries/product.queries";
import { useTranslations } from "next-intl";
import ProductCard from "../trending/ProductCard";
import { TrendingProduct } from "@/utils/types/common.types";
import { useAddToWishList, useDeleteFromWishList } from "@/apis/queries/wishlist.queries";
import { toast } from "@/components/ui/use-toast";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useMe } from "@/apis/queries/user.queries";

type SearchedStoreProductsType = {
    searchTerm?: string;
    haveAccessToken: boolean;
    cartList: any[];
    setRecordsCount: (count: number) => void;
    hideHeader?: boolean;
};

const SearchedStoreProducts: React.FC<SearchedStoreProductsType> = ({
    searchTerm,
    haveAccessToken,
    cartList,
    setRecordsCount,
    hideHeader = false
}) => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const me = useMe();

    const addToWishlist = useAddToWishList();
    const deleteFromWishlist = useDeleteFromWishList();

    const allProductsQuery = useAllProducts({
        page: 1,
        limit: 20,
        sort: "desc",
        term: searchTerm,
        userId: me?.data?.data?.tradeRole == "BUYER"
            ? undefined 
            : me?.data?.data?.tradeRole == "MEMBER" 
            ? me?.data?.data?.addedBy 
            : me?.data?.data?.id,
        userType: me?.data?.data?.tradeRole == "BUYER" ? "BUYER" : ""
    }, !!searchTerm);

    const memoizedProducts = useMemo(() => {
        return (
            allProductsQuery?.data?.data?.map((item: any) => ({
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
                    (ele: any) => ele?.userId === me?.data?.data?.id,
                ),
                shortDescription: item?.product_productShortDescription?.length
                    ? item?.product_productShortDescription?.[0]?.shortDescription
                    : "-",
                productProductPriceId: item?.product_productPrice?.[0]?.id,
                productProductPrice: item?.product_productPrice?.[0]?.offerPrice,
                consumerDiscount: item?.product_productPrice?.[0]?.consumerDiscount,
                consumerDiscountType:
                    item?.product_productPrice?.[0]?.consumerDiscountType,
                vendorDiscount: item?.product_productPrice?.[0]?.vendorDiscount,
                vendorDiscountType: item?.product_productPrice?.[0]?.vendorDiscountType,
                askForPrice: item?.product_productPrice?.[0]?.askForPrice,
                productPrices: item?.product_productPrice,
                categoryId: item?.categoryId,
                categoryLocation: item?.categoryLocation,
                consumerType: item?.product_productPrice?.[0]?.consumerType,
            })) || []
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        allProductsQuery?.data?.data,
        allProductsQuery?.data?.data?.length,
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
            (item) => item.userId === me?.data?.data?.id,
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
        } else {
            toast({
                title: response.message || t("item_not_added_to_wishlist"),
                description: t("check_your_wishlist_for_more_details"),
                variant: "danger",
            });
        }
    };

    useEffect(() => {
        setRecordsCount(memoizedProducts.length);
    }, [allProductsQuery?.isFetched, memoizedProducts.length]);

    if (allProductsQuery?.isFetched && memoizedProducts.length == 0) {
        return null;
    }

    if (hideHeader) {
        return (
            <>
                {allProductsQuery.isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, index: number) => (
                            <SkeletonProductCardLoader key={index} />
                        ))}
                    </div>
                ) : null}

                {!memoizedProducts.length && !allProductsQuery.isLoading ? null : null}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {memoizedProducts.map((item: TrendingProduct) => {
                        const cartItem = cartList?.find(
                            (el: any) => el.productId == item.id,
                        );
                        let relatedCart: any = null;
                        if (cartItem) {
                            relatedCart = cartList
                                ?.filter(
                                    (c: any) =>
                                        c.serviceId && c.cartProductServices?.length,
                                )
                                .find((c: any) => {
                                    return !!c.cartProductServices.find(
                                        (r: any) =>
                                            r.relatedCartType == "PRODUCT" &&
                                            r.productId == item.id,
                                    );
                                });
                        }
                        return (
                            <ProductCard
                                key={item.id}
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
                                relatedCart={relatedCart}
                                isAddedToCart={cartItem ? true : false}
                            />
                        );
                    })}
                </div>
            </>
        );
    }

    return (
        <section className="w-full pb-8 pt-0">
            <div className="container m-auto">
                <div className="flex flex-wrap">
                    <div className="flex w-full flex-wrap items-center justify-between border-b border-solid border-gray-300 bg-neutral-100 px-3.5 py-3.5">
                        <div className="flex flex-wrap items-center justify-start">
                            <h4 className="mr-3 whitespace-nowrap text-xl font-normal capitalize text-color-dark md:mr-6 md:text-2xl" translate="no">
                                {t("store")}
                            </h4>
                        </div>
                        <div className="flex flex-wrap items-center justify-end">
                            <Link
                                href={`/trending?term=${searchTerm}`}
                                className="mr-3.5 text-sm font-normal text-black underline sm:mr-0"
                                translate="no"
                            >
                                {t("view_all")}
                            </Link>
                        </div>
                    </div>
                </div>

                {allProductsQuery.isLoading ? (
                    <div className="grid grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, index: number) => (
                            <SkeletonProductCardLoader key={index} />
                        ))}
                    </div>
                ) : null}

                {!memoizedProducts.length && !allProductsQuery.isLoading ? (
                    <p
                        className="text-center text-sm font-medium mt-2"
                        dir={langDir}
                        translate="no"
                    >
                        {t("no_data_found")}
                    </p>
                ) : null}

                <div className="product-list-s1 w-full">
                    {memoizedProducts.map((item: TrendingProduct) => {
                        const cartItem = cartList?.find(
                            (el: any) => el.productId == item.id,
                        );
                        let relatedCart: any = null;
                        if (cartItem) {
                            relatedCart = cartList
                                ?.filter(
                                    (c: any) =>
                                        c.serviceId && c.cartProductServices?.length,
                                )
                                .find((c: any) => {
                                    return !!c.cartProductServices.find(
                                        (r: any) =>
                                            r.relatedCartType == "PRODUCT" &&
                                            r.productId == item.id,
                                    );
                                });
                        }
                        return (
                            <ProductCard
                                key={item.id}
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
                                relatedCart={relatedCart}
                                isAddedToCart={cartItem ? true : false}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default SearchedStoreProducts;