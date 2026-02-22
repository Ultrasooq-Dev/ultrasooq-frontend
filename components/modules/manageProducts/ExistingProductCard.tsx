import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import Image from "next/image";
import validator from "validator";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useRouter } from "next/navigation";
import { IoMdAdd } from "react-icons/io";

type ExistingProductCardProps = {
  selectedIds?: number[];
  onSelectedId?: (args0: boolean | string, args1: number) => void;
  id: number;
  productImage: string | null;
  productName: string;
  productPrice: number;
  offerPrice: number;
  categoryName: string;
  brandName: string;
  shortDescription: string;
  skuNo?: string;
  productType?: string;
  isDropshipPage?: boolean;
  onAddToDropship?: (productId: number) => void;
};

const ExistingProductCard: React.FC<ExistingProductCardProps> = ({
  selectedIds,
  onSelectedId,
  id,
  productImage,
  productName,
  productPrice,
  offerPrice,
  categoryName,
  brandName,
  shortDescription,
  skuNo,
  productType = "P",
  isDropshipPage = false,
  onAddToDropship,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { translate } = useDynamicTranslation();
  const router = useRouter();

  const handleAddToMyProducts = () => {
    router.push(`/product?copy=${id}&fromExisting=true`);
  };

  const handleAddToRfqProducts = () => {
    router.push(`/product?copy=${id}&productType=R`);
  };

  const handleAddToDropship = () => {
    if (onAddToDropship) {
      onAddToDropship(id);
    }
  };

  return (
    <div className="mb-4 w-full rounded-lg border border-border bg-card shadow-xs">
      {/* Compact View - Always Visible */}
      <div className="flex items-center justify-between p-4">
        {/* Left Section - Product Info */}
        <div className="flex items-center space-x-4">
          {/* Checkbox - Only show for product type P and not on dropship page */}
          {productType !== "R" && !isDropshipPage && onSelectedId && (
            <div className="flex flex-col items-center space-y-2">
              <Checkbox
                className="border border-solid border-border data-[state=checked]:bg-primary!"
                checked={selectedIds?.includes(id)}
                onCheckedChange={(checked) => {
                  onSelectedId?.(checked, id);
                }}
              />
            </div>
          )}

          {/* Product Image */}
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
            {productImage && validator.isURL(productImage) ? (
              // Check if the image is from an allowed domain (S3 bucket)
              productImage.includes('puremoon.s3.amazonaws.com') ? (
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
            <h3 className="text-lg font-semibold text-foreground">{translate(productName) || "-"}</h3>
            
            {/* Price Info */}
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{t("price")}:</span>
                <span className="text-primary font-semibold">
                  ${productPrice || 0}
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span>{t("category")}:</span>
                <span className="font-medium">{translate(categoryName) || "-"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>{t("brand")}:</span>
                <span className="font-medium">{translate(brandName) || "-"}</span>
              </div>
            </div>

            {/* SKU and Description */}
            {/* <div className="flex space-x-6 text-sm text-muted-foreground">
              {skuNo && (
                <div className="flex items-center space-x-2">
                  <span>{t("sku")}:</span>
                  <span className="font-medium">{skuNo}</span>
                </div>
              )}
              {shortDescription && (
                <div className="flex items-center space-x-2">
                  <span>{t("description")}:</span>
                  <span className="font-medium max-w-xs truncate">{shortDescription}</span>
                </div>
              )}
            </div> */}
          </div>
        </div>

        {/* Right Section - Action Button */}
        <div className="flex items-center space-x-2">
          {isDropshipPage ? (
            <Button
              onClick={handleAddToDropship}
              className="bg-info hover:bg-info/90 text-white px-4 py-2 text-sm flex items-center gap-2"
              dir={langDir}
            >
              <IoMdAdd size={16} />
              {t("add_to_dropshipable_product")}
            </Button>
          ) : productType === "R" ? (
            <Button
              onClick={handleAddToRfqProducts}
              className="bg-success hover:bg-success/90 text-white px-4 py-2 text-sm flex items-center gap-2"
              dir={langDir}
            >
              <IoMdAdd size={16} />
              {t("add_to_rfq_products")}
            </Button>
          ) : (
            <Button
              onClick={handleAddToMyProducts}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 text-sm flex items-center gap-2"
              dir={langDir}
            >
              <IoMdAdd size={16} />
              {t("add_to_my_products")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExistingProductCard;
