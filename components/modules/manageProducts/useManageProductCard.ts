import React, { useState, useEffect } from "react";
import {
  useRemoveProduct,
  useUpdateProductStatus,
  useUpdateSingleProduct,
} from "@/apis/queries/product.queries";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ManageProductCardProps } from "./manageProductCardTypes";
import { useManageProductFields } from "./useManageProductFields";

type UseManageProductCardOptions = Pick<
  ManageProductCardProps,
  | "id"
  | "productId"
  | "status"
  | "askForPrice"
  | "askForStock"
  | "productPrice"
  | "offerPrice"
  | "deliveryAfter"
  | "stock"
  | "consumerType"
  | "sellType"
  | "timeOpen"
  | "timeClose"
  | "vendorDiscount"
  | "vendorDiscountType"
  | "consumerDiscount"
  | "consumerDiscountType"
  | "minQuantity"
  | "maxQuantity"
  | "minCustomer"
  | "maxCustomer"
  | "minQuantityPerCustomer"
  | "maxQuantityPerCustomer"
  | "productCondition"
  | "onRemove"
>;

export function useManageProductCard({
  id,
  productId,
  status: initialStatus,
  askForPrice,
  askForStock,
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
}: UseManageProductCardOptions) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  // Status update part
  const [status, setStatus] = useState(initialStatus);
  const statusUpdate = useUpdateProductStatus();

  const updateStatus = async (status: string) => {
    try {
      const newStatus = status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
      const response = await statusUpdate.mutateAsync({ productPriceId: id, status: newStatus });

      if (response.status) {
        setStatus(newStatus);
        toast({ title: t("status_update_successful"), description: t("status_updated_successfully"), variant: "success" });
      } else {
        toast({ title: t("status_update_failed"), description: t("something_went_wrong"), variant: "danger" });
      }
    } catch {
      toast({ title: t("error"), description: t("failed_to_update_status"), variant: "danger" });
    }
  };

  // Stock
  const [stock, setStock] = useState(initialStock);
  const decreaseStock = () => setStock((prev) => Math.max(prev - 1, 0));
  const increaseStock = () => setStock((prev) => Math.min(prev + 1, 1000));

  // Product condition, consumer type, sell type
  const [productCondition, setCondition] = useState<string>(initialCondition);
  const [consumerType, setConsumer] = useState<string>(initialConsumerType);
  const [sellType, setSell] = useState<string>(initialSellType);

  useEffect(() => { setConsumer(initialConsumerType); }, [initialConsumerType]);
  useEffect(() => { setSell(initialSellType); }, [initialSellType]);
  useEffect(() => { setCondition(initialCondition); }, [initialCondition]);

  // Numeric/counter fields via sub-hook
  const fields = useManageProductFields({
    initialProductPrice,
    initialPrice,
    initialDelivery,
    initialTimeOpen,
    initialTimeClose,
    initialVendorDiscount,
    initialVendorDiscountType,
    initialConsumerDiscount,
    initialConsumerDiscountType,
    initialMinQuantity,
    initialMaxQuantity,
    initialMinCustomer,
    initialMaxCustomer,
    initialMinQuantityPerCustomer,
    initialMaxQuantityPerCustomer,
    initialStock,
  });

  // Update product
  const productUpdate = useUpdateSingleProduct();

  const handleUpdate = async (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    try {
      const response = await productUpdate.mutateAsync({
        productPriceId: id,
        stock,
        askForPrice,
        askForStock,
        offerPrice: fields.offerPrice,
        productPrice: fields.productPrice,
        status,
        productCondition,
        consumerType,
        sellType,
        deliveryAfter: fields.deliveryAfter,
        timeOpen: fields.timeOpen,
        timeClose: fields.timeClose,
        vendorDiscount: fields.vendorDiscount,
        vendorDiscountType: fields.vendorDiscountType,
        consumerDiscount: fields.consumerDiscount,
        consumerDiscountType: fields.consumerDiscountType,
        minQuantity: fields.minQuantity,
        maxQuantity: fields.maxQuantity,
        minCustomer: fields.minCustomer,
        maxCustomer: fields.maxCustomer,
        minQuantityPerCustomer: fields.minQuantityCustomer,
        maxQuantityPerCustomer: fields.maxQuantityCustomer,
      });

      if (response.status) {
        toast({ title: t("product_update_successful"), description: t("product_updated_successfully"), variant: "success" });
      } else {
        toast({ title: t("product_update_failed"), description: response.message || t("something_went_wrong"), variant: "danger" });
      }
    } catch {
      toast({ title: t("error"), description: t("failed_to_update_product"), variant: "danger" });
    }
  };

  // Remove product
  const productRemove = useRemoveProduct();

  const handleRemoveProduct = async () => {
    try {
      const response = await productRemove.mutateAsync({ productPriceId: id });

      if (response.status) {
        toast({ title: t("product_removed"), description: t("product_removed_successfully"), variant: "success" });
        onRemove(id);
      } else {
        toast({ title: t("product_removed"), description: t("something_went_wrong"), variant: "danger" });
      }
    } catch {
      toast({ title: t("error"), description: t("failed_to_remove_product"), variant: "danger" });
    }
  };

  const handleEditProduct = () => {
    router.push(`/product?edit=true&productId=${productId}&productPriceId=${id}`);
  };

  const handleReset = () => {
    setStock(Number(initialStock));
    setCondition(initialCondition);
    setConsumer(initialConsumerType);
    setSell(initialSellType);
    fields.resetFields({
      initialProductPrice,
      initialPrice,
      initialDelivery,
      initialTimeOpen,
      initialTimeClose,
      initialVendorDiscount,
      initialVendorDiscountType,
      initialConsumerDiscount,
      initialConsumerDiscountType,
      initialMinQuantity,
      initialMaxQuantity,
      initialMinCustomer,
      initialMaxCustomer,
      initialMinQuantityPerCustomer,
      initialMaxQuantityPerCustomer,
      initialStock,
    });
  };

  return {
    isExpanded,
    setIsExpanded,
    status,
    updateStatus,
    stock,
    setStock,
    decreaseStock,
    increaseStock,
    productCondition,
    setCondition,
    consumerType,
    setConsumer,
    sellType,
    setSell,
    ...fields,
    handleUpdate,
    handleRemoveProduct,
    handleEditProduct,
    handleReset,
  };
}
