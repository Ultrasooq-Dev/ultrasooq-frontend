import { TrendingProduct } from "@/utils/types/common.types";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useEffect, useState, useRef } from "react";
import validator from "validator";
import { Checkbox } from "@/components/ui/checkbox";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { Button } from "@/components/ui/button";
// import ShoppingIcon from "@/public/images/shopping-icon.svg";
// import EyeIcon from "@/public/images/eye-icon.svg";
// import CompareIcon from "@/public/images/compare-icon.svg";
import { FaHeart } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import ShoppingIcon from "@/components/icons/ShoppingIcon";
import { FaCircleCheck } from "react-icons/fa6";
import { useCartStore } from "@/lib/rfqStore";
import { toast } from "@/components/ui/use-toast";
import EditIcon from "@/public/images/edit-icon.svg";
import {
  useDeleteCartItem,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useClickOutside } from "use-events";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IoCloseSharp } from "react-icons/io5";
import { useRouter } from "next/navigation";

// type ServiceCardProps = {
//   item: TrendingProduct;
//   productVariants?: any[];
//   onWishlist: () => void;
//   inWishlist?: boolean;
//   haveAccessToken: boolean;
//   isInteractive?: boolean;
//   isSelectable?: boolean;
//   selectedIds?: number[];
//   onSelectedId?: (args0: boolean | string, args1: number) => void;
//   productQuantity?: number;
//   productVariant?: any;
//   cartId?: number;
//   isAddedToCart?: boolean;
//   sold?: number;
// };

const ServiceCard: React.FC<any> = ({
  item,
  manageService,
  handleServiceToCartModal,
  productVariants = [],
  onWishlist,
  inWishlist,
  haveAccessToken,
  isInteractive,
  isSelectable,
  selectedIds,
  onSelectedId,
  productQuantity = 0,
  productVariant,
  cartId,
  isAddedToCart,
  sold,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();

  const [timeLeft, setTimeLeft] = useState("");

  const deviceId = getOrCreateDeviceId() || "";

  const calculateDiscountedPrice = () => {
    const price = item.productProductPrice
      ? Number(item.productProductPrice)
      : 0;
    let discount = item.consumerDiscount || 0;
    let discountType = item.consumerDiscountType;
    
    // For non-BUYER users, try vendor discount first, but fall back to consumer discount if vendor discount is not available
    if (user?.tradeRole && user?.tradeRole != "BUYER") {
      if (item.vendorDiscount && item.vendorDiscount > 0) {
        discount = item.vendorDiscount;
        discountType = item.vendorDiscountType;
      }
      // If vendor discount is not available, keep using consumer discount
    }
    if (discountType == "PERCENTAGE") {
      return Number((price - (price * discount) / 100).toFixed(2));
    } else if (discountType == "FLAT") {
      return Number((price - discount).toFixed(2));
    }
    // Default fallback for any other discount type
    return Number((price - discount).toFixed(2));
  };

  const calculateAvgRating = useMemo(() => {
    const totalRating = item.productReview?.reduce(
      (acc: number, item: { rating: number }) => {
        return acc + item.rating;
      },
      0,
    );

    const result = totalRating / item.productReview?.length;
    return !isNaN(result) ? Math.floor(result) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.productReview?.length]);

  const calculateRatings = useMemo(
    () => (rating: number) => {
      const stars: Array<React.ReactNode> = [];
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          stars.push(<FaStar key={i} color="#FFC107" size={20} />);
        } else {
          stars.push(<FaRegStar key={i} color="#FFC107" size={20} />);
        }
      }
      return stars;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.productReview?.length],
  );

  const [quantity, setQuantity] = useState(0);
  const [selectedProductVariant, setSelectedProductVariant] = useState<any>();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState<boolean>(false);
  const handleConfirmDialog = () =>
    setIsConfirmDialogOpen(!isConfirmDialogOpen);
  const confirmDialogRef = useRef(null);
  const [isClickedOutsideConfirmDialog] = useClickOutside(
    [confirmDialogRef],
    (event) => {
      onCancelRemove();
    },
  );

  useEffect(() => {
    setQuantity(productQuantity || 0);
  }, [productQuantity]);

  useEffect(() => {
    setSelectedProductVariant(productVariant || productVariants?.[0]);
  }, [productVariants, productVariant]);

  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const deleteCartItem = useDeleteCartItem();

  const handleAddToCart = async (
    newQuantity: number,
    actionType: "add" | "remove",
    variant?: any,
  ) => {
    const minQuantity = item.productPrices?.length
      ? item.productPrices[0]?.minQuantityPerCustomer
      : null;
    const maxQuantity = item.productPrices?.length
      ? item.productPrices[0]?.maxQuantityPerCustomer
      : null;

    if (actionType == "add" && newQuantity == -1) {
      newQuantity =
        minQuantity && quantity < minQuantity ? minQuantity : quantity + 1;
    }

    if (actionType == "add" && minQuantity && minQuantity > newQuantity) {
      toast({
        description: t("min_quantity_must_be_n", { n: minQuantity }),
        variant: "danger",
      });
      return;
    }

    if (maxQuantity && maxQuantity < newQuantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      return;
    }

    if (actionType == "remove" && minQuantity && minQuantity > newQuantity) {
      setIsConfirmDialogOpen(true);
      return;
    }

    if (haveAccessToken) {
      if (!item?.productProductPriceId) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartWithLogin.mutateAsync({
        productPriceId: item?.productProductPriceId,
        quantity: newQuantity,
        productVariant: variant || selectedProductVariant,
      });

      if (response.status) {
        if (actionType === "add" && newQuantity === 0) {
          setQuantity(1);
        } else {
          setQuantity(newQuantity);
        }
        toast({
          title:
            actionType == "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        return response.status;
      } else {
        toast({
          title: t("something_went_wrong"),
          description: response.message,
          variant: "danger",
        });
      }
    } else {
      if (!item?.productProductPriceId) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartByDevice.mutateAsync({
        productPriceId: item?.productProductPriceId,
        quantity: newQuantity,
        deviceId,
        productVariant: variant || selectedProductVariant,
      });
      if (response.status) {
        if (actionType === "add" && newQuantity === 0) {
          setQuantity(1);
        } else {
          setQuantity(newQuantity);
        }
        toast({
          title:
            actionType == "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        return response.status;
      } else {
        toast({
          title: t("something_went_wrong"),
          description: response.message,
          variant: "danger",
        });
      }
    }
  };

  const handleQuantity = (quantity: number, action: "add" | "remove") => {
    const minQuantity = item.productPrices?.length
      ? item.productPrices[0]?.minQuantityPerCustomer
      : null;
    const maxQuantity = item.productPrices?.length
      ? item.productPrices[0]?.maxQuantityPerCustomer
      : null;

    if (maxQuantity && maxQuantity < quantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      setQuantity(productQuantity || maxQuantity);
      return;
    }

    setQuantity(quantity);
    if (cartId) {
      handleAddToCart(quantity, action);
    } else {
      if (minQuantity && minQuantity > quantity) {
        toast({
          description: t("min_quantity_must_be_n", { n: minQuantity }),
          variant: "danger",
        });
        return;
      }
    }
  };

  const handleQuantityChange = () => {
    if (quantity == 0 && productQuantity != 0) {
      toast({
        description: t("quantity_can_not_be_0"),
        variant: "danger",
      });
      handleQuantity(quantity, "remove");
      return;
    }

    const minQuantity = item.productPrices?.length
      ? item.productPrices[0]?.minQuantityPerCustomer
      : null;
    if (minQuantity && minQuantity > quantity) {
      toast({
        description: t("min_quantity_must_be_n", { n: minQuantity }),
        variant: "danger",
      });
      handleQuantity(quantity, quantity > productQuantity ? "add" : "remove");
      return;
    }

    const maxQuantity = item.productPrices?.length
      ? item.productPrices[0]?.maxQuantityPerCustomer
      : null;
    if (maxQuantity && maxQuantity < quantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      setQuantity(productQuantity || maxQuantity);
      return;
    }

    const action = quantity > productQuantity ? "add" : "remove";
    if (quantity != productQuantity) handleQuantity(quantity, action);
  };

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

  const onConfirmRemove = () => {
    if (cartId) handleRemoveItemFromCart(cartId);
    setIsConfirmDialogOpen(false);
  };

  const onCancelRemove = () => {
    setQuantity(productQuantity);
    setIsConfirmDialogOpen(false);
  };

  const getLocalTimestamp = (dateStr: any, timeStr: any) => {
    const date = new Date(dateStr); // Parse date part only
    const [hours, minutes] = (timeStr || "").split(":").map(Number); // Extract hours/minutes

    date.setHours(hours, minutes || 0, 0, 0); // Set correct time in local timezone

    return date.getTime(); // Return timestamp in milliseconds
  };

  // ✅ Corrected formatTime function to display (Days, Hours, Minutes, Seconds)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(
      2,
      "0",
    );
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${days} Days; ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (
      !item?.productPrices?.length ||
      item?.productPrices?.[0]?.sellType !== "BUYGROUP"
    )
      return;

    const product = item.productPrices[0];

    const startTimestamp = getLocalTimestamp(
      product.dateOpen,
      product.startTime,
    );
    const endTimestamp = getLocalTimestamp(product.dateClose, product.endTime);

    const updateCountdown = () => {
      const now = Date.now();

      if (now < startTimestamp) {
        setTimeLeft(t("not_started"));
        return;
      }

      const ms = endTimestamp - now;
      if (ms <= 0) {
        setTimeLeft(t("expired"));
        return;
      }

      setTimeLeft(formatTime(ms));
    };

    updateCountdown(); // Initial call
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [item?.productPrices?.length]);
  type Node = {
    type: string;
    children?: { text: string }[];
  };

  const getPlainText = (nodes: string | Node[]): string => {
    let parsedNodes: Node[];

    if (typeof nodes === "string") {
      parsedNodes = JSON.parse(nodes);
    } else {
      parsedNodes = nodes;
    }

    return parsedNodes
      .map((node) => node.children?.map((child) => child.text).join("") || "")
      .join("\n");
  };

  return (
    <div className="product-list-s1-col">
      <div className="product-list-s1-box relative hover:bg-slate-100">
        {isSelectable ? (
          <div className="absolute left-[10px] top-[20px]">
            <Checkbox
              className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
              checked={selectedIds?.includes(item.id)}
              onCheckedChange={(checked) => onSelectedId?.(checked, item.id)}
            />
          </div>
        ) : null}
        {timeLeft ? (
          <div className="time_left">
            <span translate="no">{timeLeft}</span>
          </div>
        ) : null}
        <Link href={manageService ? "#" : `/services/${item.id}`}>
          {item?.askForPrice !== "true" ? (
            item.consumerDiscount ? (
              <div className="absolute right-2.5 top-2.5 z-10 inline-block rounded bg-dark-orange px-2 py-1.5 text-xs font-medium capitalize leading-5 text-white">
                <span>{item.consumerDiscount}%</span>
              </div>
            ) : null
          ) : null}
          <div className="relative mx-auto mb-4 h-36 w-36">
            <Image
              src={
                item?.images?.[0]?.url && validator.isURL(item.images[0].url)
                  ? item.images[0].url
                  : PlaceholderImage
              }
              alt="product-image"
              fill
              sizes="(max-width: 768px) 100vw,
                                    (max-width: 1200px) 50vw,
                                    33vw
                                "
              className="object-cover"
              blurDataURL="/images/product-placeholder.png"
              placeholder="blur"
            />
          </div>
        </Link>

        {isInteractive ? (
          <div className="mb-3 flex flex-row items-center justify-center gap-x-3">
            {item?.askForPrice !== "true" ? (
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full p-0 shadow-md"
                onClick={() => handleAddToCart(-1, "add")}
              >
                <ShoppingIcon />
              </Button>
            ) : null}

            <Link
              href={manageService ? "#" : `/services/${item.id}`}
              className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-md!"
            >
              <FiEye size={18} />
            </Link>
            {haveAccessToken ? (
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full p-0 shadow-md"
                onClick={onWishlist}
              >
                {inWishlist ? (
                  <FaHeart color="red" size={16} />
                ) : (
                  <FaRegHeart size={16} />
                )}
              </Button>
            ) : null}
            {/* <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0 shadow-md"
              onClick={copyToClipboard}
            >
              <ShareIcon />
            </Button> */}
          </div>
        ) : null}

        <Link href={manageService ? "#" : `/services/${item.id}`}>
          <div className="relative w-full text-sm font-normal capitalize text-color-blue lg:text-base">
            <h4 className="mb-2.5 border-b border-solid border-border pb-2.5 text-xs font-normal uppercase text-color-dark">
              {item.serviceName}
            </h4>
            <p
              title={getPlainText(item.description)}
              className="overflow-hidden block text-ellipsis"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2, // Show up to 2 lines
                WebkitBoxOrient: 'vertical',
                maxWidth: '220px',
                minHeight: '1.5em',
                whiteSpace: 'normal',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {(() => {
                const text = getPlainText(item.description);
                const lines = text.split(/\r?\n/);
                if (lines.length > 2) {
                  return lines.slice(0, 2).join(' ') + '...';
                }
                return text;
              })()}
            </p>
            {/* <div className="my-1 flex">
                            {calculateRatings(calculateAvgRating)}
                            <span className="ml-2">{item.productReview?.length}</span>
                        </div> */}
          </div>
        </Link>
        {/* <div>
                    {item?.askForPrice === "true" ? (
                        <Link href={`/seller-rfq-request?product_id=${item?.id}`}>
                            <button
                                type="button"
                                className="inline-block w-full rounded-sm bg-color-yellow px-3 py-1 text-sm font-bold text-white"
                                dir={langDir}
                                translate="no"
                            >
                                {t("ask_vendor_for_price")}
                            </button>
                        </Link>
                    ) : (
                        <h5 className="py-1 text-[#1D77D1]">
                            {currency.symbol}
                            {calculateDiscountedPrice()}{" "}
                            <span className="text-muted-foreground line-through!">
                                {currency.symbol}
                                {item.productProductPrice}
                            </span>
                        </h5>
                    )}
                </div>
                {productVariants.length > 0 && <div className="mb-2">
                    <label dir={langDir}>{productVariants[0].type}</label>
                    <select
                        className="w-full"
                        value={selectedProductVariant?.value}
                        onChange={(e) => {
                            let value = e.target.value;
                            const selectedVariant = productVariants.find((variant: any) => variant.value == value);
                            setSelectedProductVariant(selectedVariant);
                            handleAddToCart(quantity, "add", selectedVariant)
                        }}
                    >
                        {productVariants.map((variant: any, index: number) => {
                            return <option key={index} value={variant.value} dir={langDir}>{variant.value}</option>;
                        })}
                    </select>
                </div>}
                <div className="quantity_wrap mb-2">
                    <label dir={langDir} translate="no">{t("quantity")}</label>
                    <div className="qty-up-down-s1-with-rgMenuAction">
                        <div className="flex items-center gap-x-3 md:gap-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="relative hover:shadow-xs"
                                onClick={() => handleQuantity(quantity - 1, "remove")}
                                disabled={
                                    quantity === 0 ||
                                    updateCartWithLogin?.isPending ||
                                    updateCartByDevice?.isPending
                                }
                            >
                                <Image
                                    src="/images/upDownBtn-minus.svg"
                                    alt="minus-icon"
                                    fill
                                    className="p-3"
                                />
                            </Button>
                            <input
                                type="text"
                                value={quantity}
                                className="h-auto w-[35px] border-none bg-transparent text-center focus:border-none focus:outline-hidden"
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setQuantity(isNaN(value) ? productQuantity : value);
                                }}
                                onBlur={handleQuantityChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="relative hover:shadow-xs"
                                onClick={() => handleQuantity(quantity + 1, "add")}
                                disabled={
                                    updateCartWithLogin?.isPending ||
                                    updateCartByDevice?.isPending
                                }
                            >
                                <Image
                                    src="/images/upDownBtn-plus.svg"
                                    alt="plus-icon"
                                    fill
                                    className="p-3"
                                />
                            </Button>
                        </div>
                    </div>
                </div> */}

        <div className="cart_button">
          {manageService ? (
            <button
              className="theme-primary-btn flex w-full items-center justify-evenly gap-x-2 rounded-sm border border-[#E8E8E8] p-[10px] text-[15px] font-bold leading-5 text-[#7F818D]"
              onClick={() =>
                router.push(`/manage-services/create-service?editId=${item.id}`)
              }
              dir={langDir}
              translate="no"
            >
              <span className="d-none-mobile">{t("edit")}</span>
            </button>
          ) : (
            <>
              {isAddedToCart ? (
                <button
                  type="button"
                  className="flex items-center justify-evenly gap-x-2 rounded-sm border border-[#E8E8E8] p-[10px] text-[15px] font-bold leading-5 text-[#7F818D]"
                  disabled={false}
                  dir={langDir}
                  translate="no"
                >
                  <FaCircleCheck color="#00C48C" />
                  {t("added_to_cart")}
                </button>
              ) : null}
              {!isAddedToCart ? (
                <button
                  type="button"
                  className="add_to_cart_button"
                  onClick={handleServiceToCartModal}
                  // disabled={quantity == 0}
                  dir={langDir}
                  translate="no"
                >
                  {t("add_to_cart")}
                </button>
              ) : null}
            </>
          )}
        </div>

        {sold !== undefined ? (
          <>
            <div className="mt-3 h-3 w-full bg-muted">
              <div className="h-full w-4/5 bg-color-yellow"></div>
            </div>
            <span
              className="w-full text-sm font-normal capitalize text-light-gray"
              translate="no"
            >
              {t("sold")}: {sold}
            </span>
          </>
        ) : null}
      </div>
      <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialog}>
        <DialogContent
          className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
          ref={confirmDialogRef}
        >
          <div className="modal-header justify-between!" dir={langDir}>
            <DialogTitle className="text-center text-xl font-bold text-dark-orange"></DialogTitle>
            <Button
              onClick={onCancelRemove}
              className={`${langDir == "ltr" ? "absolute" : ""} right-2 top-2 z-10 bg-card! text-foreground! shadow-none`}
            >
              <IoCloseSharp size={20} />
            </Button>
          </div>

          <div className="mb-4 mt-4 text-center">
            <p className="text-dark-orange">
              Do you want to remove this item from cart?
            </p>
            <div>
              <Button
                type="button"
                className="mr-2 bg-card text-destructive"
                onClick={onCancelRemove}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-destructive"
                onClick={onConfirmRemove}
              >
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceCard;
