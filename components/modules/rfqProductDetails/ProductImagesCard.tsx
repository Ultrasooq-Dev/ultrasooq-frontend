import { useMe } from "@/apis/queries/user.queries";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { isImage, isVideo } from "@/utils/helper";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import ReactPlayer from "react-player";
import validator from "validator";

type ProductImagesCardProps = {
  productDetails: any;
  onAdd: (
    args0: number,
    args1: number,
    args2: "add" | "remove",
    args3?: number,
    args4?: number,
    args5?: string,
  ) => void;
  onEdit: () => void;
  isLoading: boolean;
  onWishlist: () => void;
  inWishlist?: boolean;
  openCartCard: () => void;
  isAddedToCart?: boolean;
  cartQuantity?: number;
  offerPriceFrom?: number;
  offerPriceTo?: number;
  productNote?: string;
};

const ProductImagesCard: React.FC<ProductImagesCardProps> = ({
  productDetails,
  onAdd,
  onEdit,
  isLoading,
  onWishlist,
  inWishlist,
  openCartCard,
  isAddedToCart,
  cartQuantity = 0,
  offerPriceFrom,
  offerPriceTo,
  productNote,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const productSellerImage =
    productDetails?.product_productPrice?.[0]?.productPrice_productSellerImage;

  useEffect(() => {
    const tempImages = productSellerImage?.length
      ? productSellerImage
      : productDetails?.productImages;

    if (!tempImages) return;

    setPreviewImages(
      tempImages
        ?.filter((item: any) => item.image)
        ?.map((item: any) =>
          item?.image && validator.isURL(item.image)
            ? item.image
            : item?.video && validator.isURL(item.video)
              ? item.video
              : PlaceholderImage,
        ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSellerImage, productDetails?.productImages]);

  useEffect(() => {
    if (!api) return;

    api.on("select", (emblaApi) => {
      // Do something on select.
      const index = emblaApi.selectedScrollSnap();
      setCurrentImageIndex(index);
    });
  }, [api]);

  const me = useMe();
  const loginUserId = me?.data?.data?.id;

  return (
    <div className="product-view-s1-left">
      <div className="mb-3 flex flex-col-reverse md:mb-3 lg:mb-0 lg:grid lg:grid-cols-4 lg:gap-4">
        <div className="relative order-2 col-span-3 flex items-center space-y-4 bg-gray-100 pl-3 md:max-h-[500px] lg:pl-0">
          {!isLoading ? (
            <button
              type="button"
              className="absolute top-2.5 right-2.5 z-10 rounded-full bg-white p-2"
              onClick={onWishlist}
            >
              {inWishlist ? <FaHeart color="red" /> : <FaRegHeart />}
            </button>
          ) : null}
          {!isLoading && previewImages?.length ? (
            <Carousel
              className="w-full"
              opts={{ align: "start", loop: true }}
              setApi={setApi}
            >
              <CarouselContent className="-ml-1">
                {previewImages?.map((item, index: number) => (
                  <CarouselItem key={index} className="basis pl-1">
                    <div className="p-1">
                      <div className="relative max-h-[250px] min-h-[250px] w-full">
                        {isImage(item) ? (
                          <Image
                            src={item}
                            alt="primary-image"
                            fill
                            className="object-contain"
                          />
                        ) : isVideo(item) ? (
                          <div className="player-wrapper py-[30%]!">
                            <ReactPlayer
                              url={item}
                              width="100%"
                              height="100%"
                              // playing
                              controls
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {previewImages?.length > 1 ? (
                <CarouselPrevious className="left-0" />
              ) : null}
              {previewImages?.length > 1 ? (
                <CarouselNext className="right-0" />
              ) : null}
            </Carousel>
          ) : null}

          {!isLoading && !previewImages?.length ? (
            <div className="relative min-h-[500px] w-full">
              <Image
                src={PlaceholderImage}
                alt="primary-image"
                fill
                className="object-contain"
              />
            </div>
          ) : null}

          {isLoading ? <Skeleton className="min-h-[250px] w-full" /> : null}
        </div>

        <div className="col-span-1 m-auto flex h-full! w-full flex-wrap gap-4 self-start lg:w-auto lg:flex-col">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton className="h-28 w-28" key={index} />
              ))
            : null}

          {productDetails?.productImages
            ?.filter((item: any) => item.image)
            ?.map((item: any, index: number) => (
              <Button
                variant="ghost"
                className={cn(
                  previewImages[currentImageIndex] === item?.image ||
                    previewImages[currentImageIndex] === item?.video
                    ? "border-2 border-red-500"
                    : "",
                  "relative h-28 w-28 rounded-none bg-gray-100",
                )}
                key={item?.id}
                onClick={() => api?.scrollTo(index)}
              >
                <Image
                  src={
                    item?.image && validator.isURL(item.image)
                      ? item.image
                      : PlaceholderImage
                  }
                  alt="primary-image"
                  fill
                  className="rounded-none object-cover"
                />
              </Button>
            ))}
        </div>
      </div>

      <div className="my-2 flex w-full flex-wrap justify-end gap-3 self-end pb-2">
        {productDetails?.adminId === loginUserId ? (
          <>
            <Button
              type="button"
              onClick={onEdit}
              className="bg-color-blue h-14 max-w-[205px] flex-1 rounded-none text-base"
              dir={langDir}
              translate="no"
            >
              {t("send_to_customize")}
            </Button>
          </>
        ) : null}
      </div>

      <div className="flex w-full flex-wrap justify-end gap-3 self-end">
        <Link href={`/seller-rfq-request?product_id=${productDetails?.id}`}>
          <Button
            type="button"
            className="bg-color-yellow h-14 w-full flex-1 rounded-none text-base"
            dir={langDir}
            translate="no"
          >
            {t("ask_vendor_for_price")}
          </Button>
        </Link>
        <Button
          type="button"
          onClick={() => {
            onAdd(
              cartQuantity + 1,
              productDetails?.id,
              "add",
              offerPriceFrom,
              offerPriceTo,
              productNote || "",
            );
          }}
          disabled={isAddedToCart}
          className="bg-color-yellow h-14 max-w-[205px] flex-1 rounded-none text-base"
          translate="no"
        >
          {isAddedToCart ? t("added_to_rfq_cart") : t("add_to_rfq_cart")}
        </Button>
      </div>
    </div>
  );
};

export default ProductImagesCard;
