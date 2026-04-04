import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAddToWishList, useDeleteFromWishList } from "@/apis/queries/wishlist.queries";
import { toast } from "@/components/ui/use-toast";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { useAuth } from "@/context/AuthContext";
import { useRfqCartListByUserId, useRfqProducts, useUpdateRfqCartWithLogin } from "@/apis/queries/rfq.queries";
import { useMe } from "@/apis/queries/user.queries";
import RfqProductCard from "../rfq/RfqProductCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddToRfqForm from "../rfq/AddToRfqForm";
import { useClickOutside } from "use-events";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type SearchedRfqProductsType = {
    searchTerm?: string;
    haveAccessToken: boolean;
    setRecordsCount: (count: number) => void;
};

const SearchedRfqProducts: React.FC<SearchedRfqProductsType> = ({
    searchTerm,
    haveAccessToken,
    setRecordsCount
}) => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const queryClient = useQueryClient();
    const router = useRouter();
    const me = useMe();

    const [selectedProductId, setSelectedProductId] = useState<number>();
    const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
    const [cartList, setCartList] = useState<any[]>([]);
    const [quantity, setQuantity] = useState<number | undefined>();
    const [offerPriceFrom, setOfferPriceFrom] = useState<number | undefined>();
    const [offerPriceTo, setOfferPriceTo] = useState<number | undefined>();

    const wrapperRef = useRef(null);
    const [isClickedOutside] = useClickOutside([wrapperRef], (event) => {});
    const handleToggleAddModal = () => setIsAddToCartModalOpen(!isAddToCartModalOpen);

    const addToWishlist = useAddToWishList();
    const deleteFromWishlist = useDeleteFromWishList();

    const rfqProductsQuery = useRfqProducts({
        page: 1,
        limit: 4,
        term: searchTerm,
        adminId: me?.data?.data?.tradeRole == "MEMBER" ? me?.data?.data?.addedBy : me?.data?.data?.id,
        sortType: "newest",
    }, !!searchTerm && haveAccessToken);

    const memoizedProducts = useMemo(() => {
        if (rfqProductsQuery.data?.data) {
            return (
                rfqProductsQuery.data?.data.map((item: any) => {
                    return {
                        ...item,
                        isAddedToCart:
                            item?.product_rfqCart?.length &&
                            item?.product_rfqCart[0]?.quantity > 0,
                        quantity:
                            item?.product_rfqCart?.length &&
                            item?.product_rfqCart[0]?.quantity,
                    };
                }) || []
            );
        } else {
            return [];
        }
    }, [rfqProductsQuery.data?.data]);

    const rfqCartListByUser = useRfqCartListByUserId(
        {
            page: 1,
            limit: 100,
        },
        haveAccessToken,
    );

    useEffect(() => {
        if (rfqCartListByUser.data?.data) {
            setCartList(rfqCartListByUser.data?.data?.map((item: any) => item) || []);
        }
    }, [rfqCartListByUser.data?.data]);

    const updateRfqCartWithLogin = useUpdateRfqCartWithLogin();

    const handleRFQCart = (
        quantity: number,
        productId: number,
        action: "add" | "remove",
        offerPriceFrom?: number,
        offerPriceTo?: number,
        note?: string,
    ) => {
        if (action == "remove" && quantity == 0) {
            handleAddToCart(quantity, productId, "remove", 0, 0, "");
        } else {
            handleToggleAddModal();
            setSelectedProductId(productId);
            setQuantity(quantity);
            setOfferPriceFrom(offerPriceFrom);
            setOfferPriceTo(offerPriceTo);
        }
    };

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
                queryKey: ["rfq-products"]
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
            queryClient.invalidateQueries({
                queryKey: ["rfq-products"]
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
    }, [rfqProductsQuery?.isFetched, memoizedProducts.length]);

    if (rfqProductsQuery?.isFetched && memoizedProducts.length == 0) {
        return null;
    }

    return (
        <section className="rfq_section pb-8 pt-0">
            <div className="rfq-container px-8">
                <div className="row">
                    <div className="rfq_main_box justify-center!">
                        <div className="rfq_middle" style={{ maxWidth: "100%" }}>
                            <div className="flex flex-wrap">
                                <div className="flex w-full flex-wrap items-center justify-between border-b border-solid border-border bg-neutral-100 px-3.5 py-3.5">
                                    <div className="flex flex-wrap items-center justify-start">
                                        <h4 className="mr-3 whitespace-nowrap text-xl font-normal capitalize text-color-dark md:mr-6 md:text-2xl" translate="no">
                                            {t("rfq")}
                                        </h4>
                                    </div>
                                    <Link
                                        href={`/rfq?term=${searchTerm}`}
                                        className="mr-3.5 text-sm font-normal text-foreground underline sm:mr-0"
                                        translate="no"
                                    >
                                        {t("view_all")}
                                    </Link>
                                </div>
                            </div>

                            {rfqProductsQuery.isLoading ? (
                                <div className="grid grid-cols-4 gap-5">
                                    {Array.from({ length: 8 }).map((_, index: number) => (
                                        <SkeletonProductCardLoader key={index} />
                                    ))}
                                </div>
                            ) : null}

                            {!memoizedProducts.length && !rfqProductsQuery.isLoading ? (
                                <p
                                    className="text-center text-sm font-medium mt-2"
                                    dir={langDir}
                                    translate="no"
                                >
                                    {t("no_data_found")}
                                </p>
                            ) : null}

                            <div className="product_section product_gray_n_box">
                                <div className="row">
                                    <div className="col-lg-12 products_sec_wrap">
                                        <div className="product_sec_list w-full">
                                            {memoizedProducts.map((item: any) => (
                                                <RfqProductCard
                                                    key={item.id}
                                                    id={item.id}
                                                    productType={item?.productType || "-"}
                                                    productName={item?.productName || "-"}
                                                    productNote={
                                                        cartList?.find(
                                                            (el: any) => el.productId == item.id,
                                                        )?.note || ""
                                                    }
                                                    productStatus={item?.status}
                                                    productImages={item?.productImages}
                                                    productQuantity={item?.quantity || 0}
                                                    productPrice={item?.product_productPrice}
                                                    offerPriceFrom={
                                                        cartList?.find(
                                                            (el: any) => el.productId == item.id,
                                                        )?.offerPriceFrom
                                                    }
                                                    offerPriceTo={
                                                        cartList?.find(
                                                            (el: any) => el.productId == item.id,
                                                        )?.offerPriceTo
                                                    }
                                                    onAdd={handleRFQCart}
                                                    onToCart={handleCartPage}
                                                    onEdit={() => {
                                                        handleToggleAddModal();
                                                        setSelectedProductId(item?.id);
                                                    }}
                                                    onWishlist={() =>
                                                        handleAddToWishlist(
                                                            item.id,
                                                            item?.product_wishlist,
                                                        )
                                                    }
                                                    isCreatedByMe={item?.userId === me.data?.data?.id}
                                                    isAddedToCart={item?.isAddedToCart}
                                                    inWishlist={item?.product_wishlist?.find(
                                                        (el: any) => el?.userId === me.data?.data?.id,
                                                    )}
                                                    haveAccessToken={haveAccessToken}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isAddToCartModalOpen} onOpenChange={handleToggleAddModal}>
                <DialogContent
                    className="add-new-address-modal gap-0 p-0 md:max-w-2xl!"
                    ref={wrapperRef}
                >
                    <AddToRfqForm
                        onClose={() => {
                            setIsAddToCartModalOpen(false);
                            setSelectedProductId(undefined);
                            setQuantity(undefined);
                        }}
                        selectedProductId={selectedProductId}
                        selectedQuantity={quantity}
                        offerPriceFrom={offerPriceFrom}
                        offerPriceTo={offerPriceTo}
                    />
                </DialogContent>
            </Dialog>
        </section>
    );
}

export default SearchedRfqProducts;