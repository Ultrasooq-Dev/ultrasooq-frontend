import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import validator from "validator";
// import WishlistIcon from "@/public/images/wishlist.svg";
import { useSellerRewards } from "@/apis/queries/seller-reward.queries";
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
import SellerRewardDetail from "./SellerRewardDetail";

type ProductImagesCardProps = {
  productDetails: any;
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
  // Marketing images for dropshipped products
  additionalMarketingImages?: any[];
  // Buygroup sale timing
  saleNotStarted?: boolean;
  saleExpired?: boolean;
};

const ProductImagesCard: React.FC<ProductImagesCardProps> = ({
  productDetails,
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
  additionalMarketingImages = [],
  saleNotStarted = false,
  saleExpired = false,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Use refs to track previous values and prevent infinite loops
  const prevImagesRef = useRef<string>('');
  const prevMarketingImagesRef = useRef<string>('');

  const productSellerImage =
    productDetails?.product_productPrice?.[0]?.productPrice_productSellerImage;

  useEffect(() => {
    let tempImages = productSellerImage?.length
      ? productSellerImage
      : productDetails?.productImages;

    // For dropshipped products, prioritize marketing images
    if (productDetails?.isDropshipped && additionalMarketingImages?.length > 0) {
      // Add marketing images to the beginning of the gallery
      const marketingImageObjects = additionalMarketingImages.map((image) => ({
        image: image,
        type: 'marketing'
      }));
      tempImages = [...marketingImageObjects, ...(tempImages || [])];
    }

    if (!tempImages) return;

    const finalImages = tempImages?.map((item: any) => {
      // Handle marketing images (base64 data)
      if (item?.type === 'marketing' && item?.image) {
        return item.image;
      }
      // Handle regular product images
      if (item?.image && validator.isURL(item.image)) {
        return item.image;
      }
      // Handle videos
      if (item?.video && validator.isURL(item.video)) {
        return item.video;
      }
      // Fallback to placeholder
      return PlaceholderImage;
    });
    
    // Create a string representation to compare
    const currentImagesKey = JSON.stringify(finalImages);
    const currentMarketingKey = JSON.stringify(additionalMarketingImages);
    
    // Only update state if images actually changed
    if (
      prevImagesRef.current !== currentImagesKey ||
      prevMarketingImagesRef.current !== currentMarketingKey
    ) {
      prevImagesRef.current = currentImagesKey;
      prevMarketingImagesRef.current = currentMarketingKey;
      setPreviewImages(finalImages);
      
      // Reset carousel to first image when marketing images are added
      if (productDetails?.isDropshipped && additionalMarketingImages?.length > 0) {
        setCurrentImageIndex(0);
      }
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSellerImage, productDetails?.productImages, productDetails?.isDropshipped, additionalMarketingImages]);

  useEffect(() => {
    if (!api) {
      return;
    }

    // Only force first image if carousel is not properly initialized
    const initializeCarousel = () => {
      const currentSlide = api.selectedScrollSnap();
      
      if (isNaN(currentSlide) || currentSlide < 0) {
        api.scrollTo(0, true);
        setCurrentImageIndex(0);
      } else {
        setCurrentImageIndex(currentSlide);
      }
    };

    // Try initialization with delays
    initializeCarousel();
    setTimeout(initializeCarousel, 100);
    setTimeout(initializeCarousel, 300);

    api.on("select", (emblaApi) => {
      const index = emblaApi.selectedScrollSnap();
      if (!isNaN(index) && index >= 0) {
        setCurrentImageIndex(index);
      }
    });
  }, [api]);

  // Ensure carousel starts at marketing image for dropshipped products
  useEffect(() => {
    if (api && productDetails?.isDropshipped && additionalMarketingImages?.length > 0) {
      setTimeout(() => {
        api.scrollTo(0);
        setCurrentImageIndex(0);
      }, 100);
    }
  }, [api, productDetails?.isDropshipped, additionalMarketingImages]);

  // Force carousel to start at first image when preview images change (only on initial load)
  useEffect(() => {
    if (api && previewImages?.length > 0) {
      // Only force to first image if carousel is not initialized properly
      const forceToFirstImage = () => {
        const currentSlide = api.selectedScrollSnap();
        if (isNaN(currentSlide) || currentSlide < 0) {
          api.scrollTo(0);
          setCurrentImageIndex(0);
        }
      };
      
      // Only try once on initial load
      setTimeout(forceToFirstImage, 200);
    }
  }, [api, previewImages]);

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

  const [reward, setReward] = useState<{ [key: string]: string }>();

  const [isSellerRewardDetailModalOpen, setIsSellerRewardDetailModalOpen] =
    useState<boolean>(false);

  const handleSellerRewardDetailModal = () =>
    setIsSellerRewardDetailModalOpen(!isSellerRewardDetailModalOpen);

  const sellerRewardsQuery = useSellerRewards(
    {
      page: 1,
      limit: 1,
      productId: productDetails?.id,
      sortType: "desc",
    },
    !!productDetails?.id,
  );

  useEffect(() => {
    const reward = sellerRewardsQuery?.data?.data?.[0];
    if (reward && new Date(reward.endTime).getTime() > new Date().getTime())
      setReward(reward);
  }, [sellerRewardsQuery?.data?.data, productDetails]);

  return (
    <div className="w-full">
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-5 lg:gap-4">
        {/* Main Image Display - Clean, No Background */}
        <div className="relative order-2 col-span-4 flex items-center justify-center">
          {!isLoading && haveAccessToken ? (
            <button
              type="button"
              className="absolute top-4 right-4 z-10 rounded-full bg-white p-2.5 shadow-lg transition-all hover:scale-110 hover:shadow-xl"
              onClick={onWishlist}
            >
              {inWishlist ? <FaHeart color="red" size={20} /> : <FaRegHeart size={20} />}
            </button>
          ) : null}
          
          {!isLoading && previewImages?.length ? (
        <Carousel
          className="w-full"
          opts={{ 
            align: "start", 
            loop: true,
            startIndex: 0,
            containScroll: "trimSnaps"
          }}
          setApi={setApi}
        >
              <CarouselContent>
                {previewImages?.map((item, index: number) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                      {(isImage(item) || (typeof item === 'string' && (item.startsWith('data:image/') || item.includes('.jpg') || item.includes('.jpeg') || item.includes('.png') || item.includes('.gif') || item.includes('.webp')))) ? (
                        <Image
                          src={item}
                          alt="primary-image"
                          fill
                          className="object-contain"
                          priority={index === 0}
                          onError={(e) => {
                            e.currentTarget.src = PlaceholderImage.src;
                          }}
                        />
                      ) : isVideo(item) ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <ReactPlayer
                            url={item}
                            width="100%"
                            height="100%"
                            controls
                          />
                        </div>
                      ) : null}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : null}

          {!isLoading && !previewImages?.length ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={PlaceholderImage}
                alt="primary-image"
                fill
                className="object-contain"
              />
            </div>
          ) : null}

          {isLoading ? <Skeleton className="aspect-square w-full rounded-lg" /> : null}
        </div>

        {/* Thumbnail Column */}
        <div className="col-span-1 order-1 flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton className="h-20 w-20 flex-shrink-0 rounded-lg lg:h-24 lg:w-24" key={index} />
              ))
            : null}

          {!isLoading && previewImages?.map((item: any, index: number) => (
            <button
              key={index}
              className={cn(
                "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all lg:h-24 lg:w-24",
                previewImages[currentImageIndex] === item
                  ? "border-dark-orange shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => {
                if (api) {
                  // Force scroll to the clicked thumbnail
                  api.scrollTo(index, false); // false = with animation
                  // Update state immediately
                  setCurrentImageIndex(index);
                }
              }}
            >
              <Image
                src={item}
                alt={`thumbnail-${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

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
            selectedProductId={productDetails?.id}
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
            selectedProductId={productDetails?.id}
            onClose={() => {
              setIsCustomizeModalOpen(false);
            }}
            onAddToCart={() => router.push(`/factories-cart`)}
          />
        </DialogContent>
      </Dialog>

      {reward && (
        <Dialog
          open={isSellerRewardDetailModalOpen}
          onOpenChange={handleSellerRewardDetailModal}
        >
          <DialogContent
            className="add-new-address-modal gap-0 p-0 md:max-w-2xl!"
            ref={wrapperRef}
          >
            <SellerRewardDetail
              reward={reward}
              onClose={() => setIsSellerRewardDetailModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductImagesCard;
