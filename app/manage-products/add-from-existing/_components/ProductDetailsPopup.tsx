"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Copy, X } from "lucide-react";
import { ExistingProduct } from "./addFromExistingTypes";

interface ProductDetailsPopupProps {
  product: ExistingProduct;
  onClose: () => void;
  onSelect: (product: ExistingProduct) => void;
}

export const ProductDetailsPopup: React.FC<ProductDetailsPopupProps> = ({
  product,
  onClose,
  onSelect,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground" dir={langDir}>
            {t("product_details")}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Images */}
          <div className="mb-6">
            <h4 className="font-medium text-foreground mb-3" dir={langDir}>
              {t("product_images")}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {product.existingProductImages &&
              product.existingProductImages.length > 0 ? (
                product.existingProductImages.map((image, index) => {
                  const imageSrc = image.image;
                  const isExternalUrl =
                    imageSrc &&
                    typeof imageSrc === "string" &&
                    imageSrc.startsWith("http") &&
                    !imageSrc.includes("ultrasooq.s3.amazonaws.com");

                  return (
                    <div
                      key={index}
                      className="aspect-square bg-muted rounded-lg overflow-hidden relative"
                    >
                      {isExternalUrl ? (
                        <img
                          src={imageSrc}
                          alt={`${product.productName} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/images/no-image.jpg";
                          }}
                        />
                      ) : (
                        <Image
                          src={imageSrc}
                          alt={`${product.productName} - Image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {t("no_images_available")}
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-4">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="text-sm font-medium text-muted-foreground"
                    dir={langDir}
                  >
                    {t("product_name")}
                  </label>
                  <p className="text-foreground mt-1" dir={langDir}>
                    {product.productName}
                  </p>
                </div>
                <div>
                  <label
                    className="text-sm font-medium text-muted-foreground"
                    dir={langDir}
                  >
                    {t("category")}
                  </label>
                  <p className="text-foreground mt-1" dir={langDir}>
                    {product.category?.name || t("not_specified")}
                  </p>
                </div>
                <div>
                  <label
                    className="text-sm font-medium text-muted-foreground"
                    dir={langDir}
                  >
                    {t("brand")}
                  </label>
                  <p className="text-foreground mt-1" dir={langDir}>
                    {product.brand?.brandName || t("not_specified")}
                  </p>
                </div>
              </div>
            </div>

            {product.shortDescription && (
              <div>
                <label
                  className="text-sm font-medium text-muted-foreground"
                  dir={langDir}
                >
                  {t("short_description")}
                </label>
                <p className="text-foreground mt-1" dir={langDir}>
                  {product.shortDescription}
                </p>
              </div>
            )}

            {product.description && (
              <div>
                <label
                  className="text-sm font-medium text-muted-foreground"
                  dir={langDir}
                >
                  {t("description_and_specification")}
                </label>
                <p className="text-foreground mt-1" dir={langDir}>
                  {(() => {
                    try {
                      const desc =
                        typeof product.description === "string"
                          ? JSON.parse(product.description)
                          : product.description;

                      if (Array.isArray(desc)) {
                        const textContent = desc
                          .filter(
                            (item: any) =>
                              item.type === "p" && item.children
                          )
                          .flatMap((item: any) => item.children)
                          .map((child: any) => child.text)
                          .join(" ");
                        return textContent || "No description available";
                      }

                      return product.description;
                    } catch {
                      return product.description;
                    }
                  })()}
                </p>
              </div>
            )}

            {product.specifications && (
              <div>
                <h4
                  className="font-medium text-foreground mb-3"
                  dir={langDir}
                >
                  {t("specifications")}
                </h4>
                <div className="bg-muted rounded-lg p-4">
                  <pre
                    className="text-sm text-muted-foreground whitespace-pre-wrap"
                    dir={langDir}
                  >
                    {JSON.stringify(product.specifications, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button
            onClick={() => {
              onClose();
              onSelect(product);
            }}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Copy className="h-4 w-4 mr-2" />
            {t("select")}
          </Button>
        </div>
      </div>
    </div>
  );
};
