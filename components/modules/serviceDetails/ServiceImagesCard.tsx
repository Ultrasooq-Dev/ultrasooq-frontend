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
import { cn } from "@/lib/utils";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import validator from "validator";
// import WishlistIcon from "@/public/images/wishlist.svg";
import { useMe } from "@/apis/queries/user.queries";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { isImage, isVideo } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import ReactPlayer from "react-player";
import AddToCustomizeForm from "../factories/AddToCustomizeForm";
import ProductEditForm from "../factories/ProductEditForm";

type ServiceImagesCardProps = {
  serviceDetails: any;
  onAdd: () => void;
  onToCart: () => void;
  onToCheckout: () => void;
  hasItem: boolean;
  isLoading: boolean;
  onWishlist: () => void;
  haveAccessToken: boolean;
  inWishlist?: boolean;
  askForPrice?: string;
  openCartCard: () => void;
  onProductUpdateSuccess: () => void;
  isAddedToCart?: boolean;
  cartQuantity?: number;
};

const ServiceImagesCard: React.FC<any> = ({
  addingToCart,
  selectedFeatures,
  serviceDetails,
  onAdd,
  onToCart,
  onToCheckout,
  hasItem,
  isLoading,
  onWishlist,
  haveAccessToken,
  inWishlist,
  askForPrice,
  openCartCard,
  onProductUpdateSuccess,
  isAddedToCart,
  cartQuantity = 0,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const productSellerImage =
    serviceDetails?.product_productPrice?.[0]?.productPrice_productSellerImage;

  useEffect(() => {
    const tempImages = productSellerImage?.length
      ? productSellerImage
      : serviceDetails?.images;
    if (!tempImages) return;

    setPreviewImages(
      tempImages?.map((item: any) =>
        validator.isURL(item?.url) ? item?.url : PlaceholderImage,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSellerImage, serviceDetails?.images]);

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", (emblaApi) => {
      // Do something on select.
      const index = emblaApi.selectedScrollSnap();
      setCurrentImageIndex(index);
    });
  }, [api]);

  // For Edit Modal
  const wrapperRef = useRef(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const handleToggleEditModal = () => setIsEditModalOpen(!isEditModalOpen);

  const me = useMe();

  const loginUserId = me?.data?.data?.id;

  //  For Customize Modal

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  const handleToCustomizeModal = () =>
    setIsCustomizeModalOpen(!isCustomizeModalOpen);

  return (
    <div className="product-view-s1-left">
      <div className="mb-3 flex flex-col-reverse md:mb-3 lg:mb-0 lg:grid lg:grid-cols-4 lg:gap-4">
        <div className="relative order-2 col-span-3 flex items-center space-y-4 bg-muted md:max-h-[500px]">
          {!isLoading && haveAccessToken ? (
            <button
              type="button"
              className="absolute top-2.5 right-2.5 z-10 rounded-full bg-card p-2"
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

        <div className="col-span-1 m-auto flex h-full! flex-col gap-4 self-start">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton className="h-28 w-28" key={index} />
              ))
            : null}
          {serviceDetails?.images?.map((item: any, index: number) => {
            return (
              <Button
                variant="ghost"
                className={cn(
                  previewImages[currentImageIndex] === item?.url
                    ? "border-2 border-destructive"
                    : "",
                  "relative h-28 w-28 rounded-none bg-muted",
                )}
                key={item?.id}
                onClick={() => api?.scrollTo(index)}
              >
                {isVideo(item.url) ? (
                  <>
                    <Image
                      src={item?.thumbnailUrl || PlaceholderImage}
                      alt="video-thumbnail"
                      fill
                      className="rounded-none object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="white"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="h-8 w-8 text-foreground"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <Image
                    src={
                      item?.url && validator.isURL(item.url)
                        ? item.url
                        : PlaceholderImage
                    }
                    alt="primary-image"
                    fill
                    className="rounded-none object-contain"
                  />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* For factories type */}
      {!isLoading &&
      serviceDetails?.product_productPrice?.[0]?.isCustomProduct === "true" ? (
        <div className="my-2 flex w-full flex-wrap justify-end gap-3 self-end pb-2">
          {serviceDetails?.adminId !== loginUserId ? (
            <>
              <Button
                type="button"
                onClick={handleToCustomizeModal}
                className="bg-color-blue h-14 max-w-[205px] flex-1 rounded-none text-base"
                dir={langDir}
                translate="no"
              >
                {t("send_to_customize")}
              </Button>
              <Button
                type="button"
                onClick={onToCart}
                className="bg-color-blue h-14 max-w-[205px] flex-1 rounded-none text-base"
                dir={langDir}
                translate="no"
              >
                {t("message_vendor")}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {!isLoading && askForPrice === "true" ? (
        <Link href={`/seller-rfq-request?product_id=${serviceDetails?.id}`}>
          <Button
            type="button"
            className="bg-color-yellow h-14 w-full flex-1 rounded-none text-base"
            dir={langDir}
            translate="no"
          >
            {t("ask_vendor_for_price")}
          </Button>
        </Link>
      ) : null}
      {!isLoading && askForPrice !== "true" ? (
        <div className="flex w-full flex-wrap justify-end gap-3 self-end">
          <Button
            type="button"
            onClick={onAdd}
            className="bg-color-yellow h-14 max-w-[205px] flex-1 rounded-none text-base"
            disabled={
              isAddedToCart || selectedFeatures.length === 0 || addingToCart
            }
            translate="no"
          >
            {addingToCart
              ? t("please_wait") + "..."
              : isAddedToCart
                ? t("added_to_cart")
                : t("add_to_cart")}
          </Button>
          <Button
            type="button"
            onClick={onToCart}
            className="bg-dark-orange h-14 max-w-[205px] flex-1 rounded-none text-base"
            dir={langDir}
            translate="no"
          >
            {t("buy_now")}
          </Button>
        </div>
      ) : null}

      {/* For Edit Dialog */}

      <Dialog open={isEditModalOpen} onOpenChange={handleToggleEditModal}>
        <DialogContent
          className="add-new-address-modal h-screen gap-0 overflow-y-scroll p-0 md:max-w-2xl!"
          ref={wrapperRef}
        >
          <ProductEditForm
            onClose={() => {
              setIsEditModalOpen(false);
            }}
            selectedProductId={serviceDetails?.id}
            onProductUpdateSuccess={onProductUpdateSuccess} // Pass to form
          />
        </DialogContent>
      </Dialog>

      {/* For Customize Dialog */}
      <Dialog open={isCustomizeModalOpen} onOpenChange={handleToCustomizeModal}>
        <DialogContent
          className="add-new-address-modal gap-0 p-0 md:max-w-2xl!"
          ref={wrapperRef}
        >
          <AddToCustomizeForm
            selectedProductId={serviceDetails?.id}
            onClose={() => {
              setIsCustomizeModalOpen(false);
            }}
            onAddToCart={() => router.push(`/factories-cart`)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceImagesCard;
