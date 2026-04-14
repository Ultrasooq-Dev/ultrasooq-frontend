import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import { useTranslations } from "next-intl";
import ManageProductImage from "./ManageProductImage";
import { ProductMiniStats } from "./manageProductCardTypes";

type ManageProductInfoProps = {
  id: number;
  productName: string;
  productImage: string | null;
  productPrice: number;
  stock: number;
  productCondition: string;
  deliveryAfter: number;
  status: string;
  askForPrice: string;
  askForStock: string;
  miniStats?: ProductMiniStats | null;
  selectedIds?: number[];
  hideCheckbox?: boolean;
  hideEyeIcon?: boolean;
  offerPrice: number;
  consumerType: string;
  sellType: string;
  timeOpen: number;
  timeClose: number;
  vendorDiscount: number;
  vendorDiscountType: string | null;
  consumerDiscount: number;
  consumerDiscountType: string | null;
  minQuantity: number;
  maxQuantity: number;
  minCustomer: number;
  maxCustomer: number;
  minQuantityPerCustomer: number;
  maxQuantityPerCustomer: number;
  onSelectedId?: (args0: boolean | string, args1: number) => void;
  onSelect?: (data: { [key: string]: any }) => void;
  onUpdateStatus: (status: string) => void;
};

const ManageProductInfo: React.FC<ManageProductInfoProps> = ({
  id,
  productName,
  productImage,
  productPrice,
  stock,
  productCondition,
  deliveryAfter,
  status,
  askForPrice,
  askForStock,
  miniStats,
  selectedIds,
  hideCheckbox,
  hideEyeIcon,
  offerPrice,
  consumerType,
  sellType,
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
  minQuantityPerCustomer,
  maxQuantityPerCustomer,
  onSelectedId,
  onSelect,
  onUpdateStatus,
}) => {
  const t = useTranslations();

  return (
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
                    minQuantityPerCustomer,
                    maxQuantityPerCustomer,
                  });
                }
              }}
            />
          )}
          {!hideEyeIcon && (
            <div
              className="cursor-pointer text-muted-foreground hover:text-muted-foreground"
              onClick={() => onUpdateStatus(status)}
            >
              {status === "ACTIVE" ? <IoIosEye size={20} /> : <IoIosEyeOff size={20} />}
            </div>
          )}
        </div>
      )}

      {/* Product Image */}
      <ManageProductImage productImage={productImage} />

      {/* Product Details */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-foreground">{productName || "-"}</h3>
        </div>

        {/* Mini Analytics Badge */}
        {miniStats && (miniStats.views > 0 || miniStats.orders > 0) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>👁 {miniStats.views}</span>
            <span>📦 {miniStats.orders}</span>
            {miniStats.revenue > 0 && <span>💰 {miniStats.revenue} OMR</span>}
            {miniStats.avgRating > 0 && <span>⭐ {miniStats.avgRating}</span>}
          </div>
        )}

        {/* Stock and Price Info */}
        <div className="flex space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{t("stock")}:</span>
            <span className="text-success font-semibold">
              {askForStock === "false" || askForStock === "NO" || (askForStock as any) === false
                ? stock
                : t("ask_for_the_stock")}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{t("price")}:</span>
            <span className="text-primary font-semibold">
              {askForPrice === "false" || askForPrice === "NO" || (askForPrice as any) === false
                ? `$${productPrice}`
                : t("ask_for_the_price")}
            </span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span>{t("condition")}:</span>
            <span className="font-medium">{productCondition || "-"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>{t("delivery")}:</span>
            <span className="font-medium">
              {deliveryAfter} {t("days")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageProductInfo;
