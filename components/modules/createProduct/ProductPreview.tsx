"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, Star, MapPin } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface ProductPreviewProps {
  originalProduct: any;
  customContent: {
    productName: string;
    description: string;
    additionalImages: string[];
    marketingText: string;
  };
  finalPrice: number | string | undefined;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({
  originalProduct,
  customContent,
  finalPrice
}) => {
  const t = useTranslations();
  
  // Ensure finalPrice is a valid number
  const safeFinalPrice = Number(finalPrice) || 0;

  // Function to extract plain text from rich text (HTML/JSON) format
  const extractPlainText = (richText: any): string => {
    if (!richText) return '';

    let content = richText;

    // If it's a string, try to parse it as JSON first
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        // If parsing is successful and it's an object/array, use the parsed content
        if (typeof parsed === 'object' && parsed !== null) {
          content = parsed;
        } else {
          // It's a plain string, not JSON
          if (content.includes('<') && content.includes('>')) {
            // Remove HTML tags
            return content.replace(/<[^>]*>/g, '').trim();
          }
          return content;
        }
      } catch (e) {
        // Not a JSON string, treat as plain text or HTML
        if (content.includes('<') && content.includes('>')) {
          // Remove HTML tags
          return content.replace(/<[^>]*>/g, '').trim();
        }
        return content;
      }
    }

    // Now process the content (could be parsed JSON or original object/array)
    if (Array.isArray(content)) {
      return content.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          // Handle Plate.js format with text property
          if (item.text) return item.text;
          // Handle nested children
          if (item.children) {
            return extractPlainText(item.children);
          }
        }
        return '';
      }).filter(Boolean).join(' ').trim();
    }

    // If it's an object, try to extract text
    if (content && typeof content === 'object') {
      if (content.text) return content.text;
      if (content.children) return extractPlainText(content.children);
    }

    return '';
  };
  
  // Combine original images with additional marketing images, prioritizing marketing images
  const allImages = [
    // Marketing images first (priority)
    ...(customContent.additionalImages.map((img, index) => ({
      image: img,
      imageName: `marketing-${index}.jpg`,
      variant: { type: 'marketing', index: index + 1 }
    }))),
    // Original images second
    ...(originalProduct.productImages || [])
  ];

  // Use custom content if available, otherwise use original
  const displayName = customContent.productName || originalProduct.productName;
  const displayDescription = extractPlainText(customContent.description || originalProduct.description);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {t("how_your_product_will_appear_to_customers")}
        </h4>
        <p className="text-sm text-gray-600">
          {t("this_is_how_customers_will_see_your_dropshipped_product")}
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-0">
          {/* Product Images */}
          <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
            {allImages[0] ? (
              <Image
                src={allImages[0].image}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            
            {/* Image count badge if multiple images */}
            {allImages.length > 1 && (
              <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                +{allImages.length - 1}
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-3">
            {/* Product Name */}
            <h3 className="font-semibold text-lg line-clamp-2">
              {displayName}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-3">
              {displayDescription}
            </p>

            {/* Marketing Text */}
            {customContent.marketingText && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  {customContent.marketingText}
                </p>
              </div>
            )}

            {/* Pricing */}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">
                ${safeFinalPrice.toFixed(2)}
              </span>
              {Number(originalProduct.offerPrice) < Number(originalProduct.productPrice) && (
                <span className="text-sm text-gray-500 line-through">
                  ${Number(originalProduct.offerPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Vendor Info */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{originalProduct.vendor?.location || "Location not specified"}</span>
            </div>

            {/* Rating (mock) */}
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs text-gray-500">(4.8)</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t("add_to_cart")}
              </Button>
              <Button variant="outline" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison with Original */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-sm text-gray-700 mb-2">
          {t("changes_made")}:
        </h5>
        <ul className="text-xs text-gray-600 space-y-1">
          {customContent.productName !== originalProduct.productName && (
            <li>• {t("product_name_customized")}</li>
          )}
          {customContent.description !== originalProduct.description && (
            <li>• {t("description_customized")}</li>
          )}
          {customContent.marketingText && (
            <li>• {t("marketing_text_added")}</li>
          )}
          {customContent.additionalImages.length > 0 && (
            <li>• {t("additional_images_added")} ({customContent.additionalImages.length})</li>
          )}
          <li>• {t("price_updated")}: ${originalProduct.productPrice} → ${finalPrice.toFixed(2)}</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductPreview;
