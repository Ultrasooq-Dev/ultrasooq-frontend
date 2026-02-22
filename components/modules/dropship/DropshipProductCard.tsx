"use client";
import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Heart, 
  HeartOff, 
  Eye, 
  Package,
  DollarSign,
  User
} from "lucide-react";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";

interface DropshipProductCardProps {
  product: any;
  onSelect: (product: any) => void;
  onWishlist: () => void;
  isCreatedByMe?: boolean;
  inWishlist?: any;
  haveAccessToken?: boolean;
}

const DropshipProductCard: React.FC<DropshipProductCardProps> = ({
  product,
  onSelect,
  onWishlist,
  isCreatedByMe = false,
  inWishlist,
  haveAccessToken = false,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { translate } = useDynamicTranslation();

  const productImage = product?.productImages?.[0]?.image;
  const productName = translate(product?.productName) || t("no_name");
  const productPrice = Number(product?.productPrice) || 0;
  const productDescription = product?.productDescription || "";
  const brandName = translate(product?.brand?.brandName) || t("no_brand");
  const categoryName = translate(product?.category?.name) || t("no_category");
  const vendorName = product?.userBy?.companyName || 
    `${product?.userBy?.firstName || ""} ${product?.userBy?.lastName || ""}`.trim() ||
    product?.userBy?.email ||
    t("unknown_vendor");

  const isInWishlist = !!inWishlist;

  const handleSelect = () => {
    onSelect(product);
  };

  const handleWishlist = () => {
    if (haveAccessToken) {
      onWishlist();
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border border-border rounded-lg overflow-hidden">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          {productImage && (validator.isURL(productImage) || productImage.startsWith('data:image/')) ? (
            // Check if the image is from an allowed domain (S3 bucket) or is a data URL
            productImage.includes('puremoon.s3.amazonaws.com') || productImage.startsWith('data:image/') ? (
              <Image
                src={productImage}
                alt={productName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ) : (
              // Use regular img tag for external URLs not in allowed domains
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = PlaceholderImage.src;
                }}
              />
            )
          ) : (
            <Image
              src={PlaceholderImage}
              alt={productName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge 
              variant={product?.status === 'ACTIVE' ? 'default' : 'secondary'}
              className="bg-success/10 text-success border-success/20"
            >
              {product?.status === 'ACTIVE' ? t("active") : t("inactive")}
            </Badge>
          </div>

          {/* Wishlist Button */}
          {haveAccessToken && (
            <button
              onClick={handleWishlist}
              className="absolute top-3 right-3 p-2 bg-card/80 hover:bg-card rounded-full shadow-sm transition-colors"
              aria-label={isInWishlist ? t("remove_from_wishlist") : t("add_to_wishlist")}
            >
              {isInWishlist ? (
                <Heart className="h-4 w-4 text-destructive fill-current" />
              ) : (
                <HeartOff className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-foreground mb-2 line-clamp-2 text-sm leading-5">
            {productName}
          </h3>

          {/* Brand and Category */}
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span className="truncate">{brandName}</span>
            <span className="text-muted-foreground">•</span>
            <span className="truncate">{categoryName}</span>
          </div>

          {/* Vendor Info */}
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{vendorName}</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-lg font-bold text-success">
                ${productPrice.toFixed(2)}
              </span>
            </div>
            
            {/* Dropship Badge */}
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
              {t("dropshipable")}
            </Badge>
          </div>

          {/* Description Preview */}
          {productDescription && (
            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
              {productDescription.length > 100 
                ? `${productDescription.substring(0, 100)}...` 
                : productDescription
              }
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSelect}
              className="flex-1 bg-primary hover:bg-primary/90 text-white text-sm py-2"
              size="sm"
            >
              <Package className="h-4 w-4 mr-2" />
              {t("create_dropship")}
            </Button>
            
            {haveAccessToken && (
              <Button
                onClick={() => {/* Handle view details */}}
                variant="outline"
                size="sm"
                className="px-3"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* My Product Indicator */}
          {isCreatedByMe && (
            <div className="mt-2 pt-2 border-t border-border">
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                {t("my_product")}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DropshipProductCard;
