"use client";
import CartProductCardWrapper from "@/components/modules/cartList/CartProductCardWrapper";
import ServiceCard from "@/components/modules/cartList/ServiceCard";
import { CartItem } from "@/utils/types/cart.types";
import { useTranslations } from "next-intl";
import CartEmptyState from "./CartEmptyState";

interface CartItemListProps {
  memoizedCartList: CartItem[];
  loading: boolean;
  haveAccessToken: boolean;
  cartByUserEmpty: boolean;
  cartByUserLoading: boolean;
  cartByDeviceEmpty: boolean;
  cartByDeviceLoading: boolean;
  langDir: string;
  onRemoveProduct: (cartId: number) => void;
  onRemoveService: (cartId: number, serviceFeatureId: number) => void;
  onWishlist: (productId: number) => void;
}

const CartItemList = ({
  memoizedCartList,
  loading,
  haveAccessToken,
  cartByUserEmpty,
  cartByUserLoading,
  cartByDeviceEmpty,
  cartByDeviceLoading,
  langDir,
  onRemoveProduct,
  onRemoveService,
  onWishlist,
}: CartItemListProps) => {
  const t = useTranslations();

  return (
    <div className="mb-6 rounded-lg border-2 border-primary/20 bg-primary/5/30 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-bold text-foreground"
            dir={langDir}
            translate="no"
          >
            {t("items_in_your_cart") || "Items in Your Cart"}
          </h2>
          <p
            className="mt-1 text-sm text-muted-foreground"
            dir={langDir}
            translate="no"
          >
            {memoizedCartList.length}{" "}
            {memoizedCartList.length === 1 ? t("item") : t("items")}{" "}
            {t("added_by_you")}
          </p>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1">
          <span className="text-sm font-semibold text-primary">
            {memoizedCartList.length}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <CartEmptyState
          haveAccessToken={haveAccessToken}
          cartByUserEmpty={cartByUserEmpty}
          cartByUserLoading={cartByUserLoading}
          cartByDeviceEmpty={cartByDeviceEmpty}
          cartByDeviceLoading={cartByDeviceLoading}
          loading={loading}
        />

        {!loading && (
          <div className="space-y-4">
            {memoizedCartList?.map((item: CartItem) => {
              if (item.cartType == "DEFAULT") {
                const relatedCart = memoizedCartList
                  ?.filter(
                    (c: any) => c.serviceId && c.cartProductServices?.length,
                  )
                  .find((c: any) => {
                    return !!c.cartProductServices.find(
                      (r: any) =>
                        r.relatedCartType == "PRODUCT" &&
                        r.productId == item.productId,
                    );
                  });
                return (
                  <CartProductCardWrapper
                    key={item.id}
                    item={item}
                    onRemove={onRemoveProduct}
                    onWishlist={onWishlist}
                    haveAccessToken={haveAccessToken}
                    relatedCart={relatedCart}
                  />
                );
              }

              if (!item.cartServiceFeatures?.length) return null;

              const features = item.cartServiceFeatures.map((feature: any) => ({
                id: feature.id,
                serviceFeatureId: feature.serviceFeatureId,
                quantity: feature.quantity,
              }));

              const relatedCart: any = memoizedCartList
                ?.filter(
                  (c: any) => c.productId && c.cartProductServices?.length,
                )
                .find((c: any) => {
                  return !!c.cartProductServices.find(
                    (r: any) =>
                      r.relatedCartType == "SERVICE" &&
                      r.serviceId == item.serviceId,
                  );
                });

              return item.cartServiceFeatures.map((feature: any) => (
                <div
                  key={feature.id}
                  className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md"
                >
                  <ServiceCard
                    cartId={item.id}
                    serviceId={item.serviceId}
                    serviceFeatureId={feature.serviceFeatureId}
                    serviceFeatureName={feature.serviceFeature.name}
                    serviceCost={Number(feature.serviceFeature.serviceCost)}
                    cartQuantity={feature.quantity}
                    serviceFeatures={features}
                    relatedCart={relatedCart}
                    onRemove={() => onRemoveService(item.id, feature.id)}
                  />
                </div>
              ));
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItemList;
