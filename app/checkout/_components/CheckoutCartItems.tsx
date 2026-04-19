"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ProductCard from "@/components/modules/checkout/ProductCard";
import ServiceCard from "@/components/modules/checkout/ServiceCard";
import Select from "react-select";
import { CartItem } from "@/utils/types/cart.types";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { shippingOptions } from "./checkoutUtils";

interface CheckoutCartItemsProps {
  memoizedCartList: any[];
  sellerIds: number[];
  shippingInfo: any[];
  setShippingInfo: (v: any[]) => void;
  shippingErrors: any[];
  productPricingInfoMap: Map<number, any>;
  invalidProducts: number[];
  notAvailableProducts: number[];
  haveAccessToken: boolean;
  memoziedAddressList: any[];
  selectedShippingAddressId: string | null;
  setSelectedSellerId: (v: number) => void;
  setSelectedShippingType: (v: string) => void;
  setFromCityId: (v: number) => void;
  setToCityId: (v: number) => void;
  setIsShippingModalOpen: (v: boolean) => void;
  setIsConfirmDialogOpen: (v: boolean) => void;
  setSelectedCartId: (v: number) => void;
  handleAddToCart: (qty: number, action: "add" | "remove", priceId: number, variant?: any) => void;
  handleAddToWishlist: (productId: number) => void;
  handleRemoveServiceFromCart: (cartId: number, featureId: number) => void;
}

const CheckoutCartItems: React.FC<CheckoutCartItemsProps> = ({
  memoizedCartList,
  sellerIds,
  shippingInfo,
  setShippingInfo,
  shippingErrors,
  productPricingInfoMap,
  invalidProducts,
  notAvailableProducts,
  haveAccessToken,
  memoziedAddressList,
  selectedShippingAddressId,
  setSelectedSellerId,
  setSelectedShippingType,
  setFromCityId,
  setToCityId,
  setIsShippingModalOpen,
  setIsConfirmDialogOpen,
  setSelectedCartId,
  handleAddToCart,
  handleAddToWishlist,
  handleRemoveServiceFromCart,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const options = shippingOptions(t);

  const productItems = memoizedCartList.filter((item: any) => item.productId);
  const serviceItems = memoizedCartList.filter((item: any) => item.serviceId);

  return (
    <>
      {productItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
            {t("products")}
          </h3>
          <div className="space-y-4">
            {sellerIds.map((sellerId: number, index: number) => (
              <div key={sellerId} className="border border-border rounded-lg p-4 bg-muted">
                <div className="space-y-4">
                  {memoizedCartList
                    ?.filter((item: CartItem) => item.productPriceDetails && item.productPriceDetails.adminId === sellerId)
                    ?.map((item: CartItem) => {
                      const productInfo = productPricingInfoMap.get(item.productId);
                      return (
                        <ProductCard
                          key={item.id}
                          cartId={item.id}
                          productId={item.productId}
                          productPriceId={item.productPriceId}
                          productName={item.productPriceDetails?.productPrice_product?.productName}
                          offerPrice={item.productPriceDetails?.offerPrice}
                          productQuantity={item.quantity}
                          productVariant={item.object}
                          productImages={item.productPriceDetails?.productPrice_product?.productImages}
                          consumerDiscount={productInfo?.consumerDiscount ?? item.productPriceDetails?.consumerDiscount ?? 0}
                          consumerDiscountType={productInfo?.consumerDiscountType ?? item.productPriceDetails?.consumerDiscountType}
                          vendorDiscount={productInfo?.vendorDiscount ?? item.productPriceDetails?.vendorDiscount ?? 0}
                          vendorDiscountType={productInfo?.vendorDiscountType ?? item.productPriceDetails?.vendorDiscountType}
                          consumerType={productInfo?.consumerType ?? (item.productPriceDetails as any)?.consumerType}
                          categoryId={productInfo?.categoryId ?? (item.productPriceDetails as any)?.productCategoryId}
                          categoryLocation={productInfo?.categoryLocation ?? (item.productPriceDetails as any)?.productCategoryLocation}
                          categoryConnections={productInfo?.categoryConnections || []}
                          onAdd={handleAddToCart}
                          onRemove={(cartId: number) => {
                            setIsConfirmDialogOpen(true);
                            setSelectedCartId(cartId);
                          }}
                          onWishlist={handleAddToWishlist}
                          haveAccessToken={haveAccessToken}
                          invalidProduct={invalidProducts.includes(item.productId)}
                          cannotBuy={notAvailableProducts.includes(item.productId)}
                        />
                      );
                    }) || []}

                  {/* Shipping Options per seller */}
                  <div className="mt-4 p-4 bg-card rounded-lg border border-border">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3" dir={langDir} translate="no">
                      Shipping Options
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Shipping Method</Label>
                        <Select
                          className="mt-1"
                          options={options}
                          value={options.find((o) => shippingInfo[index]?.shippingType === o.value)}
                          menuPlacement="auto"
                          menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }), menu: (base) => ({ ...base, zIndex: 9999 }) }}
                          onChange={(newValue: any) => {
                            const data = [...shippingInfo];
                            data[index].shippingType = newValue?.value;
                            data[index].info.serviceId = null;
                            data[index].info.serviceName = null;
                            data[index].info.shippingCharge = 0;
                            setShippingInfo(data);
                          }}
                        />
                      </div>
                      {["SELLERDROP", "PLATFORM"].includes(shippingInfo[index]?.shippingType) && (
                        <>
                          <div className="flex items-end">
                            <Button
                              onClick={() => {
                                setSelectedSellerId(sellerId);
                                setSelectedShippingType(shippingInfo[index].shippingType);
                                const item = memoizedCartList?.find(
                                  (item: CartItem) => item.productPriceDetails.adminId === sellerId,
                                );
                                if (item) setFromCityId(item.productPriceDetails?.productCityId);
                                const address = memoziedAddressList.find(
                                  (item: any) => item.id === Number(selectedShippingAddressId),
                                );
                                if (address) setToCityId(address.cityId);
                                setIsShippingModalOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                              translate="no"
                            >
                              {t("select_service")}
                            </Button>
                          </div>
                          <div>
                            {shippingInfo[index]?.info?.serviceId ? (
                              <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                                <p className="text-sm font-medium text-success">
                                  {shippingInfo[index].info.serviceName}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-destructive">
                                {shippingErrors?.[index]?.errors?.serviceId || "Please select a shipping service"}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {serviceItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
            {t("services")}
          </h3>
          <div className="space-y-4">
            {serviceItems.map((item: any) => {
              if (!item.cartServiceFeatures?.length) return null;
              const features = item.cartServiceFeatures.map((feature: any) => ({
                id: feature.id,
                serviceFeatureId: feature.serviceFeatureId,
                quantity: feature.quantity,
              }));
              const relatedCart: any = memoizedCartList
                ?.filter((c: any) => c.productId && c.cartProductServices?.length)
                .find((c: any) =>
                  c.cartProductServices.find(
                    (r: any) => r.relatedCartType === "SERVICE" && r.serviceId === item.serviceId,
                  ),
                );
              return item.cartServiceFeatures.map((feature: any) => (
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
              ));
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default CheckoutCartItems;
