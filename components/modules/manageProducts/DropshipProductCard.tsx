import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import Image from "next/image";
import validator from "validator";
import { 
  IoMdCreate, 
  IoMdTrash,
  IoMdCreate as IoMdEdit,
  IoMdArrowDown,
  IoMdArrowUp
} from "react-icons/io";
// Removed useUpdateDropshipProductStatus since status is admin-controlled
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PRODUCT_TYPE_LABELS } from "@/utils/constants";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

type DropshipProductCardProps = {
  selectedIds?: number[];
  onSelectedId?: (args0: boolean | string, args1: number) => void;
  onSelect?: (data: { [key: string]: any }) => void;
  id: number;
  productId: number;
  status: string;
  productImage: string | null;
  productImages?: any[]; // Add this to get all images
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
  hideCheckbox?: boolean;
  hideEyeIcon?: boolean;
  hideActionButtons?: boolean;
  disableFields?: boolean;
  // Dropship specific props
  originalProduct?: {
    id: number;
    productName: string;
    productPrice: number;
    userBy?: {
      firstName: string;
      lastName: string;
      companyName: string;
    };
  };
  dropshipMarkup?: number;
  customMarketingContent?: any;
  additionalMarketingImages?: string[];
  isDropshipped?: boolean;
};

const DropshipProductCard: React.FC<DropshipProductCardProps> = ({
  selectedIds,
  onSelectedId,
  onSelect,
  id,
  productId,
  status: initialStatus,
  productImage,
  productImages = [],
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
  hideCheckbox = false,
  hideEyeIcon = false,
  hideActionButtons = false,
  disableFields = false,
  // Dropship specific props
  originalProduct,
  dropshipMarkup = 0,
  customMarketingContent,
  additionalMarketingImages = [],
  isDropshipped = false,
}) => {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const { currentAccountData } = useAuth();

  // State management
  const [status] = useState<string>(initialStatus);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle edit
  const handleEdit = () => {
    router.push(`/product?id=${productId}&type=edit`);
  };

  // Handle remove - show confirmation dialog
  const handleRemove = () => {
    setShowDeleteDialog(true);
  };

  // Handle confirmed delete
  const handleConfirmDelete = () => {
    onRemove(id);
  };

  // Handle selection
  const handleSelection = (checked: boolean) => {
    if (onSelectedId) {
      onSelectedId(checked, id);
    }
    if (onSelect) {
      onSelect({
        id,
        productId,
        productName,
        productPrice: initialProductPrice,
        offerPrice: initialPrice,
        status,
        isDropshipped: true,
      });
    }
  };

  const isSelected = selectedIds?.includes(id) || false;
  const isActive = status === 'ACTIVE';

  return (
    <Card className={`relative group transition-all duration-200 hover:shadow-lg ${
      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
    }`}>
      <CardContent className="p-6">
        {/* Collapsible Header */}
        <div className="flex items-start justify-between">
          {/* Left Section - Product Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {!hideCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelection}
                className="flex-shrink-0"
              />
            )}
            
            {/* Product Images */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
              {productImage && validator.isURL(productImage) && !productImage.includes('puremoon.s3.amazonaws.com') ? (
                <img
                  src={productImage}
                  alt={productName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PlaceholderImage.src;
                  }}
                />
              ) : (
                <Image
                  src={productImage || PlaceholderImage}
                  alt={productName}
                  fill
                  className="object-cover"
                />
              )}
              {productImages.length > 1 && (
                <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                  +{productImages.length - 1}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              {/* Product Name and Badges */}
              <div className="flex items-start gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 text-base leading-tight flex-1 min-w-0">
                  {productName}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {t("dropship")}
                  </Badge>
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className={`text-xs px-2 py-1 ${
                      isActive 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {isActive ? t("active") : t("inactive")}
                  </Badge>
                </div>
              </div>
              
              {/* Original Product Info */}
              {originalProduct && (
                <div className="mb-3">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium text-gray-600">{t("original_product")}:</span>
                  </div>
                  <div className="text-sm text-gray-800 font-medium mt-1">
                    {originalProduct.productName}
                    {originalProduct.userBy && (
                      <span className="ml-2 text-gray-600 font-normal">
                        ({originalProduct.userBy.companyName || `${originalProduct.userBy.firstName} ${originalProduct.userBy.lastName}`})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing and Stock Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-green-600">
                    ${Number(initialPrice).toFixed(2)}
                  </span>
                  {Number(dropshipMarkup) > 0 && (
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      +${Number(dropshipMarkup).toFixed(2)} {t("markup")}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t("stock")}:</span> 
                  <span className="ml-1 font-semibold text-gray-800">{initialStock} {t("in_stock")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex flex-col items-end space-y-2">
            {/* Action Buttons Row */}
            {!hideActionButtons && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                  onClick={handleRemove}
                  title={t("remove")}
                >
                  <IoMdTrash size={18} />
                </button>
              </div>
            )}

            {/* Expand/Collapse Button */}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? t("collapse") : t("expand")}
            >
              {isExpanded ? <IoMdArrowUp size={18} /> : <IoMdArrowDown size={18} />}
            </button>
          </div>
        </div>

        {/* Expanded View - Detailed Information */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Pricing Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-base border-b border-gray-200 pb-2">{t("pricing_details")}</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-white rounded-md border">
                    <span className="text-sm font-medium text-gray-700">{t("selling_price")}:</span>
                    <span className="font-bold text-lg text-green-600">
                      ${Number(initialPrice).toFixed(2)}
                    </span>
                  </div>
                  
                  {Number(dropshipMarkup) > 0 && (
                    <div className="flex justify-between items-center py-2 px-3 bg-white rounded-md border">
                      <span className="text-sm font-medium text-gray-700">{t("markup")}:</span>
                      <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-1 rounded">
                        +${Number(dropshipMarkup).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {originalProduct && (
                    <div className="flex justify-between items-center py-2 px-3 bg-white rounded-md border">
                      <span className="text-sm font-medium text-gray-700">{t("original_price")}:</span>
                      <span className="text-gray-600 font-semibold">
                        ${Number(originalProduct.productPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Product Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-base border-b border-gray-200 pb-2">{t("product_details")}</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-white rounded-md border">
                    <span className="text-sm font-medium text-gray-700">{t("stock")}:</span>
                    <span className="font-semibold text-gray-800">{initialStock}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 px-3 bg-white rounded-md border">
                    <span className="text-sm font-medium text-gray-700">{t("delivery_after")}:</span>
                    <span className="font-semibold text-gray-800">{initialDelivery} {t("days")}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 px-3 bg-white rounded-md border">
                    <span className="text-sm font-medium text-gray-700">{t("consumer_type")}:</span>
                    <span className="capitalize font-semibold text-gray-800">{initialConsumerType.toLowerCase()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 px-3 bg-white rounded-md border">
                    <span className="text-sm font-medium text-gray-700">{t("sell_type")}:</span>
                    <span className="capitalize font-semibold text-gray-800">{initialSellType.toLowerCase().replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing Content Preview */}
            {customMarketingContent?.marketingText && customMarketingContent.marketingText.trim() && (
              <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-3 text-base">
                  {t("marketing_text")}:
                </h4>
                <div className="text-sm text-yellow-800 leading-relaxed">
                  {customMarketingContent.marketingText}
                </div>
              </div>
            )}

            {/* Action Buttons Section */}
            {!hideActionButtons && (
              <div className="mt-6 flex justify-center space-x-3 border-t border-gray-300 pt-4">
                <button
                  type="button"
                  className="flex items-center justify-center rounded-lg bg-green-500 px-6 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors shadow-sm"
                  onClick={handleEdit}
                >
                  <IoMdEdit size={16} className="mr-2" />
                  {t("edit")}
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title={t("confirm_delete")}
        description={t("confirm_delete_dropship_product")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
      />
    </Card>
  );
};

export default DropshipProductCard;
