import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDropshipProductsFromOriginal } from "@/apis/queries/product.queries";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface DropshipProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalProductId: number;
  originalProductName: string;
}

const DropshipProductsModal: React.FC<DropshipProductsModalProps> = ({
  isOpen,
  onClose,
  originalProductId,
  originalProductName,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  
  const { data: dropshipProductsData, isLoading, error } = useDropshipProductsFromOriginal(
    originalProductId,
    isOpen // Only fetch when modal is open
  );

  const dropshipProducts = dropshipProductsData?.data || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold" dir={langDir}>
            {t("dropship_products_created_from")}: {originalProductName}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{t("error_loading_dropship_products")}</p>
            </div>
          ) : dropshipProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t("no_dropship_products_created")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dropshipProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 relative">
                    {product.productImages?.[0]?.image ? (
                      (() => {
                        const imageSrc = product.productImages[0].image;
                        const isExternalUrl = imageSrc && 
                          typeof imageSrc === "string" && 
                          imageSrc.startsWith("http") && 
                          !imageSrc.includes("puremoon.s3.amazonaws.com");
                        
                        return isExternalUrl ? (
                          <img
                            src={imageSrc}
                            alt={product.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = PlaceholderImage.src;
                            }}
                          />
                        ) : (
                          <Image
                            src={imageSrc}
                            alt={product.productName}
                            fill
                            className="object-cover"
                          />
                        );
                      })()
                    ) : (
                      <Image
                        src={PlaceholderImage}
                        alt={product.productName}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {product.productName}
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">
                      {t("by")}: {(() => {
                        if (!product.user) return 'Unknown User';
                        
                        // Prioritize accountName since other fields are null in database
                        if (product.user.accountName) {
                          return product.user.accountName;
                        }
                        
                        if (product.user.companyName) {
                          return product.user.companyName;
                        }
                        
                        if (product.user.firstName && product.user.lastName) {
                          return `${product.user.firstName} ${product.user.lastName}`;
                        }
                        
                        if (product.user.firstName) {
                          return product.user.firstName;
                        }
                        
                        if (product.user.email) {
                          return product.user.email;
                        }
                        
                        return 'Unknown User';
                      })()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("created")}: {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                    {product.brand?.brandName && (
                      <p className="text-xs text-gray-500">
                        {t("brand")}: {product.brand.brandName}
                      </p>
                    )}
                  </div>

                  {/* Price Info */}
                  <div className="text-right">
                    <p className="font-semibold text-primary text-lg">
                      ${product.product_productPrice?.[0]?.productPrice || '0'}
                    </p>
                    {product.product_productPrice?.[0]?.offerPrice && 
                     product.product_productPrice?.[0]?.offerPrice !== '0' && (
                      <p className="text-sm text-warning">
                        {t("offer")}: ${product.product_productPrice?.[0]?.offerPrice}
                      </p>
                    )}
                    <button
                      onClick={() => window.open(`/product/${product.id}`, '_blank')}
                      className="mt-2 px-3 py-1 bg-primary/10 text-primary rounded text-sm hover:bg-primary/20 transition-colors"
                    >
                      {t("view_product")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            {t("close")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DropshipProductsModal;
