import React, { useEffect, useState } from "react";
import {
  // useOneWithProductPrice,
  useProductById,
} from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import SellerCard from "@/components/modules/otherSellers/SellerCard";
import Image from "next/image";
import { useParams } from "next/navigation";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { getOrCreateDeviceId } from "@/utils/helper";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import {
  useCartListByDevice,
  useCartListByUserId,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type OtherSellerSectionProps = {
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  otherSellerDetails?: any[];
};

const OtherSellerSection: React.FC<OtherSellerSectionProps> = ({
  setIsDrawerOpen,
  otherSellerDetails,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const searchParams = useParams();
  // const searchQuery = useSearchParams();
  const { toast } = useToast();
  const deviceId = getOrCreateDeviceId() || "";
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  // const otherSellerId = searchQuery?.get("sellerId");
  // const otherProductId = searchQuery?.get("productId");

  const me = useMe();
  const productQueryById = useProductById(
    {
      productId: searchParams?.id ? (searchParams?.id as string) : "",
      userId: me.data?.data?.id,
    },
    !!searchParams?.id,
  );
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const cartListByDeviceQuery = useCartListByDevice(
    {
      page: 1,
      limit: 10,
      deviceId,
    },
    !haveAccessToken,
  );
  const cartListByUser = useCartListByUserId(
    {
      page: 1,
      limit: 10,
    },
    haveAccessToken,
  );
  // const productQueryByOtherSeller = useOneWithProductPrice(
  //   {
  //     productId: otherProductId ? Number(otherProductId) : 0,
  //     adminId: otherSellerId ? Number(otherSellerId) : 0,
  //   },
  //   !!otherProductId && !!otherSellerId,
  // );

  const productDetails = productQueryById.data?.data;

  const getProductQuantityByUser = cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.quantity;

  const getProductQuantityByDevice = cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.quantity;

  const handleAddToCart = async (quantity: number, sellerId: number) => {
    if (haveAccessToken) {
      if (!sellerId) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartWithLogin.mutateAsync({
        productPriceId: sellerId,
        quantity,
      });

      if (response.status) {
        toast({
          title: t("item_added_to_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });

        return response.status;
      }
    } else {
      if (!productDetails?.product_productPrice?.[0]?.id) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartByDevice.mutateAsync({
        productPriceId: productDetails?.product_productPrice?.[0]?.id,
        quantity,
        deviceId,
      });
      if (response.status) {
        toast({
          title: t("item_added_to_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        return response.status;
      }
    }
  };

  const handleCheckoutPage = async (sellerId: number) => {
    if (getProductQuantityByUser === 1 || getProductQuantityByDevice === 1) {
      router.push("/checkout");
      return;
    }

    const response = await handleAddToCart(1, sellerId);
    if (response) {
      setTimeout(() => {
        router.push("/checkout");
      }, 2000);
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
    <section className="w-full">
      <div className="container m-auto px-3">
        <div className="flex flex-wrap border border-solid border-border shadow-md">
          <div className="flex w-full flex-wrap items-center justify-between">
            <div className="flex w-full items-center justify-end border-b border-solid border-border px-4 py-3.5">
              <div className="flex flex-wrap">
                <div className="mr-3 flex items-center justify-end">
                  <span>{productDetails?.productName}</span>
                </div>
                <div className="relative flex w-[50px] items-center justify-end">
                  <Image
                    src={
                      productDetails?.productImages?.[0]?.image ||
                      PlaceholderImage
                    }
                    alt="product-preview"
                    fill
                  />
                </div>
              </div>
            </div>

            {otherSellerDetails?.map(
              (item: {
                id: number;
                adminDetail: {
                  id: number;
                  firstName: string;
                  lastName: string;
                  tradeRole: string;
                };
                offerPrice: string;
                productPrice: string;
                productId: number;
                consumerDiscount: number;
                consumerDiscountType: string;
                vendorDiscount: number;
                vendorDiscountType: string;
                askForPrice: string;
                askForStock: string;
                deliveryAfter: number;
                productPrice_productLocation: {
                  locationName: string;
                };
              }) => (
                <SellerCard
                  key={item?.id}
                  productId={item?.productId}
                  sellerName={`${item?.adminDetail?.firstName} ${item?.adminDetail?.lastName}`}
                  offerPrice={item?.offerPrice}
                  productPrice={item?.productPrice}
                  onAdd={() => handleAddToCart(1, item?.id)}
                  onToCheckout={() => handleCheckoutPage(item?.id)}
                  productProductPrice={item?.offerPrice}
                  consumerDiscount={item?.consumerDiscount}
                  consumerDiscountType={item?.consumerDiscountType}
                  vendorDiscount={item?.vendorDiscount}
                  vendorDiscountType={item?.vendorDiscountType}
                  askForPrice={item?.askForPrice}
                  askForStock={item?.askForStock}
                  deliveryAfter={item?.deliveryAfter}
                  productLocation={
                    item?.productPrice_productLocation?.locationName
                  }
                  sellerId={item?.adminDetail?.id}
                  soldByTradeRole={item?.adminDetail?.tradeRole}
                  onChooseSeller={() => {
                    router.push(
                      `/trending/${searchParams?.id}?sellerId=${item?.adminDetail?.id}&productId=${item?.productId}`,
                    );
                    router.refresh();
                    setIsDrawerOpen(false);
                  }}
                />
              ),
            )}
          </div>
        </div>

        {!otherSellerDetails?.length && !productQueryById.isLoading ? (
          <p className="py-10 text-center text-sm font-medium" dir={langDir} translate="no">
            {t("no_sellers_found")}
          </p>
        ) : null}

        {productQueryById?.isLoading ? (
          <div className="my-2 space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default OtherSellerSection;
