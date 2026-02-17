import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { CartItem } from "@/utils/types/cart.types";
import { useTranslations } from "use-intl";
import ProductCard from "./ProductCard";
import ServiceCard from "./ServiceCard";
import { toast } from "@/components/ui/use-toast";
import {
    useDeleteCartItem,
    useDeleteServiceFromCart
} from "@/apis/queries/cart.queries";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/apis/queries/user.queries";
import { useAddToWishList } from "@/apis/queries/wishlist.queries";

type CartProps = {
    haveAccessToken: boolean;
    isLoadingCart: boolean;
    cartItems: any[];
};

const Cart: React.FC<CartProps> = ({
    haveAccessToken,
    isLoadingCart,
    cartItems
}) => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const queryClient = useQueryClient();
    const me = useMe();

    const deleteCartItem = useDeleteCartItem();
    const deleteServiceFromCart = useDeleteServiceFromCart();
    const addToWishlist = useAddToWishList();

    const handleRemoveItemFromCart = async (cartId: number) => {
        const response = await deleteCartItem.mutateAsync({ cartId });
        if (response.status) {
            toast({
                title: t("item_removed_from_cart"),
                description: t("check_your_cart_for_more_details"),
                variant: "success",
            });
        } else {
            toast({
                title: t("item_not_removed_from_cart"),
                description: t("check_your_cart_for_more_details"),
                variant: "danger",
            });
        }
    };

    const handleRemoveServiceFromCart = async (
        cartId: number,
        serviceFeatureId: number,
    ) => {
        const cartItem = cartItems.find((item: any) => item.id == cartId);
        let payload: any = { cartId };
        if (cartItem?.cartServiceFeatures?.length > 1) {
            payload.serviceFeatureId = serviceFeatureId;
        }
        const response = await deleteServiceFromCart.mutateAsync(payload);
        if (response.status) {
            toast({
                title: t("item_removed_from_cart"),
                description: t("check_your_cart_for_more_details"),
                variant: "success",
            });
        } else {
            toast({
                title: response.message || t("item_not_removed_from_cart"),
                description: response.message || t("check_your_cart_for_more_details"),
                variant: "danger",
            });
        }
    };

    const handleAddToWishlist = async (productId: number) => {
        const response = await addToWishlist.mutateAsync({
            productId: productId,
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
                    { productId, userId: me.data?.data?.id },
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

    return (
        <div className="card-item cart-items">
            <div className="cart-item-lists">
                {!isLoadingCart && !cartItems?.length ? (
                    <div className="px-3 py-6">
                        <p
                            className="my-3 text-center"
                            dir={langDir}
                            translate="no"
                        >
                            {t("no_cart_items")}
                        </p>
                    </div>
                ) : null}

                <div className="px-3">
                    {isLoadingCart ? (
                        <div className="my-3 space-y-3">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <Skeleton key={i} className="h-28 w-full" />
                            ))}
                        </div>
                    ) : null}
                </div>

                {cartItems?.map((item: CartItem) => {
                    if (item.cartType == "DEFAULT") {
                        let relatedCart = cartItems
                            ?.filter((c: any) => c.serviceId && c.cartProductServices?.length)
                            .find((c: any) => {
                                return !!c.cartProductServices
                                    .find((r: any) => r.relatedCartType == 'PRODUCT' && r.productId == item.productId);
                            });
                        return (
                            <ProductCard
                                key={item.id}
                                cartId={item.id}
                                productId={item.productId}
                                productPriceId={item.productPriceId}
                                productName={
                                    item.productPriceDetails?.productPrice_product?.productName
                                }
                                offerPrice={item.productPriceDetails?.offerPrice}
                                productQuantity={item.quantity}
                                productVariant={item.object}
                                productImages={
                                    item.productPriceDetails?.productPrice_product?.productImages
                                }
                                consumerDiscount={
                                    item.productPriceDetails?.consumerDiscount
                                }
                                consumerDiscountType={
                                    item.productPriceDetails?.consumerDiscountType
                                }
                                vendorDiscount={
                                    item.productPriceDetails?.vendorDiscount
                                }
                                vendorDiscountType={
                                    item.productPriceDetails?.vendorDiscountType
                                }
                                onRemove={() => handleRemoveItemFromCart(item.id)}
                                onWishlist={() => handleAddToWishlist(item.productId)}
                                haveAccessToken={haveAccessToken}
                                minQuantity={
                                    item?.productPriceDetails?.minQuantityPerCustomer
                                }
                                maxQuantity={
                                    item?.productPriceDetails?.maxQuantityPerCustomer
                                }
                                relatedCart={relatedCart}
                            />
                        );
                    }

                    if (!item.cartServiceFeatures?.length) return null;

                    const features = item.cartServiceFeatures.map(
                        (feature: any) => ({
                            id: feature.id,
                            serviceFeatureId: feature.serviceFeatureId,
                            quantity: feature.quantity,
                        }),
                    );

                    let relatedCart: any = cartItems
                        ?.filter((c: any) => c.productId && c.cartProductServices?.length)
                        .find((c: any) => {
                            return !!c.cartProductServices
                                .find((r: any) => r.relatedCartType == 'SERVICE' && r.serviceId == item.serviceId);
                        });

                    return item.cartServiceFeatures.map((feature: any) => {
                        return (
                            <ServiceCard
                                key={feature.id}
                                cartId={item.id}
                                serviceId={item.serviceId}
                                serviceFeatureId={feature.serviceFeatureId}
                                serviceFeatureName={feature.serviceFeature.name}
                                serviceCost={Number(feature.serviceFeature.serviceCost)}
                                cartQuantity={feature.quantity}
                                serviceFeatures={features}
                                relatedCart={relatedCart}
                                onRemove={() => handleRemoveServiceFromCart(item.id, feature.id)}
                            />
                        );
                    });
                })}
            </div>
        </div>
    );
};

export default Cart;