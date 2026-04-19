"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { IoMdAdd } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import DropshipProductCard from "@/components/modules/manageProducts/DropshipProductCard";
import Pagination from "@/components/shared/Pagination";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";

interface DropshipProductsTabProps {
  dropshipProductsQuery: any;
  dropshipStatus: string;
  dropshipPage: number;
  setDropshipStatus: (status: string) => void;
  onDropshipPageChange: (page: number) => void;
  onDropshipProductDelete: (id: number) => void;
}

const DropshipProductsTab: React.FC<DropshipProductsTabProps> = ({
  dropshipProductsQuery,
  dropshipStatus,
  dropshipPage,
  setDropshipStatus,
  onDropshipPageChange,
  onDropshipProductDelete,
}) => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filters - Left Side */}
      <div className="lg:w-1/4">
        <div className="bg-card rounded-lg shadow-xs p-6">
          <h3 className="text-lg font-semibold mb-4">{t("filters")}</h3>

          <div className="mb-4">
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              {t("status")}
            </Label>
            <select
              value={dropshipStatus}
              onChange={(e) => setDropshipStatus(e.target.value)}
              className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">{t("all_statuses")}</option>
              <option value="ACTIVE">{t("active")}</option>
              <option value="INACTIVE">{t("inactive")}</option>
            </select>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium text-muted-foreground mb-2">{t("dropship_stats")}</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("total_products")}:</span>
                <span className="font-medium">{dropshipProductsQuery.data?.totalCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("active_products")}:</span>
                <span className="font-medium text-success">
                  {dropshipProductsQuery.data?.data?.filter(
                    (p: any) => p.status === "ACTIVE",
                  ).length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid - Right Side */}
      <div className="lg:w-3/4">
        <div className="bg-card rounded-lg shadow-xs p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{t("dropship_products")}</h3>
            <Button
              onClick={() => router.push("/product?tab=dropship")}
              className="flex items-center gap-2"
            >
              <IoMdAdd className="h-4 w-4" />
              {t("create_dropship_product")}
            </Button>
          </div>

          {dropshipProductsQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonProductCardLoader key={index} />
              ))}
            </div>
          ) : dropshipProductsQuery.data?.data?.length > 0 ? (
            <div className="space-y-4">
              {dropshipProductsQuery.data.data.map((product: any) => (
                <DropshipProductCard
                  key={product.id}
                  id={product.id}
                  productId={product.id}
                  status={product.status}
                  productImage={
                    product.productImages?.find(
                      (img: any) => img.variant?.type === "marketing",
                    )?.image || product.productImages?.[0]?.image
                  }
                  productImages={product.productImages}
                  productName={product.productName}
                  productPrice={product.productPrice}
                  offerPrice={product.offerPrice}
                  deliveryAfter={
                    product.originalProduct?.product_productPrice?.[0]?.deliveryAfter ||
                    product.productPrices?.[0]?.deliveryAfter ||
                    1
                  }
                  stock={
                    product.originalProduct?.product_productPrice?.[0]?.stock ||
                    product.productPrices?.[0]?.stock ||
                    0
                  }
                  consumerType={product.productPrices?.[0]?.consumerType || "EVERYONE"}
                  sellType={product.productPrices?.[0]?.sellType || "NORMALSELL"}
                  timeOpen={product.productPrices?.[0]?.timeOpen}
                  timeClose={product.productPrices?.[0]?.timeClose}
                  vendorDiscount={product.productPrices?.[0]?.vendorDiscount}
                  vendorDiscountType={product.productPrices?.[0]?.vendorDiscountType}
                  consumerDiscount={product.productPrices?.[0]?.consumerDiscount}
                  consumerDiscountType={product.productPrices?.[0]?.consumerDiscountType}
                  minQuantity={product.productPrices?.[0]?.minQuantity}
                  maxQuantity={product.productPrices?.[0]?.maxQuantity}
                  minCustomer={product.productPrices?.[0]?.minCustomer}
                  maxCustomer={product.productPrices?.[0]?.maxCustomer}
                  minQuantityPerCustomer={product.productPrices?.[0]?.minQuantityPerCustomer}
                  maxQuantityPerCustomer={product.productPrices?.[0]?.maxQuantityPerCustomer}
                  productCondition={product.productCondition}
                  onRemove={onDropshipProductDelete}
                  originalProduct={product.originalProduct}
                  dropshipMarkup={product.dropshipMarkup}
                  customMarketingContent={product.customMarketingContent}
                  additionalMarketingImages={product.additionalMarketingImages}
                  isDropshipped={product.isDropshipped}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Store className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t("no_dropship_products")}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t("no_dropship_products_description")}
              </p>
              <Button
                onClick={() => router.push("/product?tab=dropship")}
                className="flex items-center gap-2"
              >
                <IoMdAdd className="h-4 w-4" />
                {t("create_first_dropship_product")}
              </Button>
            </div>
          )}

          {dropshipProductsQuery.data?.totalCount > 12 && (
            <div className="mt-8">
              <Pagination
                page={dropshipPage}
                setPage={onDropshipPageChange}
                totalCount={dropshipProductsQuery.data?.totalCount}
                limit={12}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DropshipProductsTab;
