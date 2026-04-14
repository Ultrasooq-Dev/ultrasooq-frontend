"use client";
import { useState } from "react";
import { useDropshipProducts, useDeleteDropshipProduct } from "@/apis/queries/dropship.queries";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { ActiveTab } from "./manageProductsTypes";

export function useDropshipState(activeTab: ActiveTab) {
  const t = useTranslations();
  const { toast } = useToast();
  const [dropshipPage, setDropshipPage] = useState(1);
  const [dropshipStatus, setDropshipStatus] = useState<string>("");

  const dropshipProductsQuery = useDropshipProducts(
    { page: dropshipPage, limit: 12, status: dropshipStatus || undefined },
    activeTab === "dropship-products",
  );

  const deleteDropshipProductMutation = useDeleteDropshipProduct();

  const handleDropshipPageChange = (newPage: number) => { setDropshipPage(newPage); };

  const handleDropshipProductDelete = async (productId: number) => {
    try {
      await deleteDropshipProductMutation.mutateAsync({ id: productId });
      toast({
        title: t("success"),
        description: t("dropship_product_deleted_successfully"),
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("failed_to_delete_dropship_product"),
        variant: "destructive",
      });
    }
  };

  return {
    dropshipPage,
    dropshipStatus, setDropshipStatus,
    dropshipProductsQuery,
    handleDropshipPageChange,
    handleDropshipProductDelete,
  };
}
