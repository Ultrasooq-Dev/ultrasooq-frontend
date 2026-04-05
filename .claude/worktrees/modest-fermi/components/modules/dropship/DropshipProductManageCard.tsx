import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import Image from "next/image";
import validator from "validator";
import EditIcon from "@/public/images/edit-rfq.png";
import Link from "next/link";
import { IoIosEyeOff, IoIosEye } from "react-icons/io";
import { 
  IoMdCreate, 
  IoMdRefresh, 
  IoMdTrash,
  IoMdArrowDown,
  IoMdArrowUp,
  IoMdCreate as IoMdEdit
} from "react-icons/io";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import DropshipProductsModal from "./DropshipProductsModal";

type DropshipProductManageCardProps = {
  selectedIds?: number[];
  onSelectedId?: (args0: boolean | string, args1: number) => void;
  onSelect?: (data: { [key: string]: any }) => void;
  id: number;
  productId: number;
  status: string;
  askForPrice: string;
  askForStock: string;
  productImage: string | null;
  productName: string;
  productPrice: string;
  offerPrice: string;
  deliveryAfter: number;
  stock: number;
  consumerType: string;
  sellType: string;
  timeOpen: number | null;
  timeClose: number | null;
  vendorDiscount: number | null;
  vendorDiscountType: string | null;
  consumerDiscount: number | null;
  consumerDiscountType: string | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  minCustomer: number | null;
  maxCustomer: number | null;
  minQuantityPerCustomer: number | null;
  maxQuantityPerCustomer: number | null;
  productCondition: string;
  onRemove: (id: number) => void;
  onWishlist?: () => void;
  inWishlist?: boolean;
  hideCheckbox?: boolean;
  hideEyeIcon?: boolean;
  hideActionButtons?: boolean;
  disableFields?: boolean;
  productType?: string;
  isDropshipped?: boolean;
  isCreatedByMe?: boolean;
  haveAccessToken?: boolean;
  brandName?: string;
  categoryName?: string;
  shortDescription?: string;
  skuNo?: string;
};

const DropshipProductManageCard: React.FC<DropshipProductManageCardProps> = ({
  selectedIds,
  onSelectedId,
  onSelect,
  id,
  productId,
  status: initialStatus,
  askForPrice,
  askForStock,
  productImage,
  productName,
  productPrice: initialProductPrice,
  offerPrice: initialPrice,
  deliveryAfter: initialDelivery,
  stock: initialStock,
  consumerType: initialConsumerType,
  sellType: initialSellType,
  timeOpen: initialTimeOpen,
  timeClose: initialTimeClose,
  vendorDiscount: initialVendorDiscount,
  vendorDiscountType: initialVendorDiscountType,
  consumerDiscount: initialConsumerDiscount,
  consumerDiscountType: initialConsumerDiscountType,
  minQuantity: initialMinQuantity,
  maxQuantity: initialMaxQuantity,
  minCustomer: initialMinCustomer,
  maxCustomer: initialMaxCustomer,
  minQuantityPerCustomer: initialMinQuantityPerCustomer,
  maxQuantityPerCustomer: initialMaxQuantityPerCustomer,
  productCondition: initialCondition,
  onRemove,
  onWishlist,
  inWishlist,
  hideCheckbox = false,
  hideEyeIcon = false,
  hideActionButtons = false,
  disableFields = false,
  productType,
  isDropshipped = false,
  isCreatedByMe = false,
  haveAccessToken = false,
  brandName,
  categoryName,
  shortDescription,
  skuNo,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Local state for form fields
  const [status, setStatus] = useState(initialStatus);
  const [productPrice, setProductPrice] = useState(initialProductPrice);
  const [offerPrice, setOfferPrice] = useState(initialPrice);
  const [deliveryAfter, setDeliveryAfter] = useState(initialDelivery);
  const [stock, setStock] = useState(initialStock);
  const [consumerType, setConsumerType] = useState(initialConsumerType);
  const [sellType, setSellType] = useState(initialSellType);
  const [timeOpen, setTimeOpen] = useState(initialTimeOpen);
  const [timeClose, setTimeClose] = useState(initialTimeClose);
  const [vendorDiscount, setVendorDiscount] = useState(initialVendorDiscount);
  const [vendorDiscountType, setVendorDiscountType] = useState(initialVendorDiscountType);
  const [consumerDiscount, setConsumerDiscount] = useState(initialConsumerDiscount);
  const [consumerDiscountType, setConsumerDiscountType] = useState(initialConsumerDiscountType);
  const [minQuantity, setMinQuantity] = useState(initialMinQuantity);
  const [maxQuantity, setMaxQuantity] = useState(initialMaxQuantity);
  const [minCustomer, setMinCustomer] = useState(initialMinCustomer);
  const [maxCustomer, setMaxCustomer] = useState(initialMaxCustomer);
  const [minQuantityCustomer, setMinQuantityCustomer] = useState(initialMinQuantityPerCustomer);
  const [maxQuantityCustomer, setMaxQuantityCustomer] = useState(initialMaxQuantityPerCustomer);
  const [productCondition, setProductCondition] = useState(initialCondition);
  
  // Modal state
  const [showDropshipModal, setShowDropshipModal] = useState(false);

  const handleEdit = () => {
    router.push(`/product?edit=true&productId=${productId}&productPriceId=${id}`);
  };


  const handleRemove = () => {
    if (window.confirm(t("are_you_sure_you_want_to_delete_this_product"))) {
      onRemove(id);
    }
  };

  const handleWishlistToggle = () => {
    if (onWishlist) {
      onWishlist();
    }
  };

  return (
    <div className="mb-4 w-full rounded-lg border border-border bg-card shadow-xs">
      {/* Compact View - Always Visible */}
      <div className="flex items-center justify-between p-4">
        {/* Left Section - Product Info */}
        <div className="flex items-center space-x-4">
          {/* Checkbox and Eye Icon */}
          {!hideCheckbox && !hideEyeIcon && (
            <div className="flex flex-col items-center space-y-2">
              {!hideCheckbox && (
                <Checkbox
                  className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                  checked={selectedIds?.includes(id)}
                  onCheckedChange={(checked) => {
                    onSelectedId?.(checked, id);
                    if (checked) {
                      onSelect?.({
                        stock,
                        askForPrice,
                        askForStock,
                        offerPrice,
                        productPrice,
                        status,
                        productCondition,
                        consumerType,
                        sellType,
                        deliveryAfter,
                        timeOpen,
                        timeClose,
                        vendorDiscount,
                        vendorDiscountType,
                        consumerDiscount,
                        consumerDiscountType,
                        minQuantity,
                        maxQuantity,
                        minCustomer,
                        maxCustomer,
                        minQuantityPerCustomer: minQuantityCustomer,
                        maxQuantityPerCustomer: maxQuantityCustomer,
                      });
                    }
                  }}
                />
              )}
              {!hideEyeIcon && (
                <div
                  className="cursor-pointer text-muted-foreground hover:text-muted-foreground"
                  onClick={() => setStatus(status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                >
                  {status === "ACTIVE" ? <IoIosEye size={20} /> : <IoIosEyeOff size={20} />}
                </div>
              )}
            </div>
          )}

          {/* Product Image */}
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
            {productImage && validator.isURL(productImage) ? (
              // Check if the image is from an allowed domain (S3 bucket)
              productImage.includes('ultrasooq.s3.amazonaws.com') ? (
                <Image
                  src={productImage}
                  alt="product-image"
                  fill
                  sizes="96px"
                  className="object-cover"
                  blurDataURL="/images/product-placeholder.png"
                  placeholder="blur"
                />
              ) : (
                // Use regular img tag for external URLs not in allowed domains
                <img
                  src={productImage}
                  alt="product-image"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PlaceholderImage.src;
                  }}
                />
              )
            ) : (
              <Image
                src={PlaceholderImage}
                alt="product-image"
                fill
                sizes="96px"
                className="object-cover"
                blurDataURL="/images/product-placeholder.png"
                placeholder="blur"
              />
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-foreground">{productName || "-"}</h3>
              {/* Product Type Badges */}
              {productType === 'D' && !isDropshipped && (
                <span className="px-2 py-1 text-xs font-medium bg-info/10 text-info rounded-full">
                  {t("dropshipable_product")}
                </span>
              )}
              {productType === 'P' && (
                <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {t("regular_product")}
                </span>
              )}
              {isDropshipped && (
                <span className="px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full">
                  {t("dropship_product")}
                </span>
              )}
            </div>
            
            {/* Stock and Price Info */}
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{t("stock")}:</span>
                <span className="text-success font-semibold">
                  {askForStock === "false" || askForStock === "NO" || (askForStock as any) === false ? stock : t("ask_for_the_stock")}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{t("price")}:</span>
                <span className="text-primary font-semibold">
                  {askForPrice === "false" || askForPrice === "NO" || (askForPrice as any) === false ? `$${productPrice}` : t("ask_for_the_price")}
                </span>
              </div>
              {offerPrice && offerPrice !== "0" && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{t("offer_price")}:</span>
                  <span className="text-warning font-semibold">${offerPrice}</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex space-x-4 text-xs text-muted-foreground">
              {brandName && (
                <span>{t("brand")}: {brandName}</span>
              )}
              {categoryName && (
                <span>{t("category")}: {categoryName}</span>
              )}
            </div>

            {/* Short Description */}
            {shortDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2">{shortDescription}</p>
            )}

            {/* Status Badge */}
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                status === "ACTIVE" 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              }`}>
                {status === "ACTIVE" ? t("active") : t("inactive")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Wishlist Button */}
          {haveAccessToken && !isCreatedByMe && (
            <button
              onClick={handleWishlistToggle}
              className={`p-2 rounded-lg border transition-colors ${
                inWishlist 
                  ? "bg-destructive/5 border-destructive/20 text-destructive" 
                  : "bg-muted border-border text-muted-foreground hover:bg-destructive/5 hover:border-destructive/20 hover:text-destructive"
              }`}
              title={inWishlist ? t("remove_from_wishlist") : t("add_to_wishlist")}
            >
              <Heart 
                size={16} 
                className={inWishlist ? "fill-current" : ""} 
              />
            </button>
          )}

          {/* Action Buttons */}
          {!hideActionButtons && (
            <div className="flex items-center space-x-2">
              {/* View Dropship Products Button - Only show for dropshipable products */}
              {productType === 'D' && !isDropshipped && (
                <button
                  onClick={() => setShowDropshipModal(true)}
                  className="px-3 py-1 bg-info/10 text-info rounded text-xs hover:bg-info/20 transition-colors"
                  title={t("view_dropship_products")}
                >
                  {t("view_dropship_products")}
                </button>
              )}

              <button
                onClick={handleEdit}
                className="p-2 text-muted-foreground hover:text-success hover:bg-success/5 rounded-lg transition-colors"
                title={t("edit_product")}
              >
                <IoMdEdit size={18} />
              </button>

              <button
                onClick={handleRemove}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
                title={t("delete_product")}
              >
                <IoMdTrash size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dropship Products Modal */}
      <DropshipProductsModal
        isOpen={showDropshipModal}
        onClose={() => setShowDropshipModal(false)}
        originalProductId={productId}
        originalProductName={productName}
      />
    </div>
  );
};

export default DropshipProductManageCard;
