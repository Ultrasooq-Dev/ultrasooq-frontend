import { UseFormReturn } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import {
  useCreateProduct,
  useUpdateSingleProduct,
  useUpdateProduct,
} from "@/apis/queries/product.queries";
import { useUploadMultipleFile } from "@/apis/queries/upload.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { buildProductPayload } from "./buildProductPayload";

interface UseProductSubmitOptions {
  form: UseFormReturn<any>;
  activeProductType: string | undefined;
  watchProductImages: any[];
  isEditMode: boolean;
  editProductQuery: any;
  productId: string | null;
  productQueryByIdData?: any;
}

export const useProductSubmit = ({
  form,
  activeProductType,
  watchProductImages,
  isEditMode,
  editProductQuery,
  productId,
  productQueryByIdData,
}: UseProductSubmitOptions) => {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { data: currentAccount } = useCurrentAccount();
  const uploadMultiple = useUploadMultipleFile();
  const createProduct = useCreateProduct();
  const updateProductPrice = useUpdateSingleProduct();
  const updateProductFull = useUpdateProduct();

  const handleUploadedFile = async (list: any[]) => {
    if (list?.length) {
      const formData = new FormData();
      list.forEach((item: { path: File; id: string }) => {
        formData.append("content", item.path);
      });
      const response = await uploadMultiple.mutateAsync(formData);
      if (response.status && response.data) return response.data;
    }
  };

  const onSubmit = async (formData: any) => {
    const currentUserId = currentAccount?.data?.account?.id;
    if (!currentUserId) {
      toast({ title: t("error"), description: t("unable_to_determine_account"), variant: "danger" });
      return;
    }

    const isWholesaleProduct = searchParams?.get("productType") === "D";

    const { updatedFormData, savedProductCondition, savedIsStockRequired, savedIsOfferPriceRequired } =
      await buildProductPayload(formData, activeProductType, watchProductImages, isWholesaleProduct, handleUploadedFile);

    if (productId && searchParams?.get("copy")) {
      updatedFormData.existingProductId = parseInt(productId);
    }

    // Mark copied product as ACTIVE when name matches original
    if (
      productQueryByIdData &&
      searchParams?.get("copy") &&
      updatedFormData.productName?.trim() == productQueryByIdData?.productName?.trim()
    ) {
      updatedFormData.status = "ACTIVE";
    }

    let response;
    try {
      if (isEditMode) {
        const productPriceId = searchParams?.get("productPriceId");
        const actualProductId = productId || editProductQuery?.data?.data?.id;
        if (!productPriceId || !actualProductId) {
          toast({ title: t("error"), description: t("product_id_not_found"), variant: "danger" });
          return;
        }

        const calculatedStatus =
          activeProductType === "R"
            ? updatedFormData.offerPrice || savedIsOfferPriceRequired ? "ACTIVE" : "INACTIVE"
            : updatedFormData.productPrice || savedIsOfferPriceRequired ? "ACTIVE" : "INACTIVE";

        const fullProductUpdateData = {
          productId: parseInt(actualProductId),
          productType: updatedFormData.productType || (activeProductType === "R" ? "R" : "P"),
          productName: updatedFormData.productName,
          categoryId: updatedFormData.categoryId,
          brandId: updatedFormData.brandId,
          skuNo: updatedFormData.skuNo || editProductQuery?.data?.data?.skuNo || "",
          productTagList:
            updatedFormData.productTagList?.map((tag: any) => ({
              tagId: typeof tag === "object" ? tag.value || tag.tagId : tag,
            })) || [],
          productImagesList: updatedFormData.productImagesList || [],
          placeOfOriginId: updatedFormData.placeOfOriginId || 0,
          productPrice: updatedFormData.productPrice || 0,
          offerPrice: updatedFormData.offerPrice || 0,
          description: updatedFormData.description || "",
          specification: updatedFormData.specification || "",
          keywords: updatedFormData.keywords || "",
          status: calculatedStatus as "ACTIVE" | "INACTIVE",
        };

        const priceUpdateData = {
          productPriceId: parseInt(productPriceId),
          stock: updatedFormData.productPriceList?.[0]?.stock || 0,
          deliveryAfter: updatedFormData.productPriceList?.[0]?.deliveryAfter || 0,
          timeOpen: updatedFormData.productPriceList?.[0]?.timeOpen || null,
          timeClose: updatedFormData.productPriceList?.[0]?.timeClose || null,
          consumerType: updatedFormData.productPriceList?.[0]?.consumerType || "CONSUMER",
          sellType: updatedFormData.productPriceList?.[0]?.sellType || "NORMALSELL",
          vendorDiscount: updatedFormData.productPriceList?.[0]?.vendorDiscount || null,
          vendorDiscountType: updatedFormData.productPriceList?.[0]?.vendorDiscountType || null,
          consumerDiscount: updatedFormData.productPriceList?.[0]?.consumerDiscount || null,
          consumerDiscountType: updatedFormData.productPriceList?.[0]?.consumerDiscountType || null,
          minQuantity: updatedFormData.productPriceList?.[0]?.minQuantity || null,
          maxQuantity: updatedFormData.productPriceList?.[0]?.maxQuantity || null,
          minCustomer: updatedFormData.productPriceList?.[0]?.minCustomer || null,
          maxCustomer: updatedFormData.productPriceList?.[0]?.maxCustomer || null,
          minQuantityPerCustomer: updatedFormData.productPriceList?.[0]?.minQuantityPerCustomer || null,
          maxQuantityPerCustomer: updatedFormData.productPriceList?.[0]?.maxQuantityPerCustomer || null,
          productCondition: savedProductCondition,
          askForPrice: savedIsOfferPriceRequired ? "YES" : "NO",
          askForStock: savedIsStockRequired ? "YES" : "NO",
          status: calculatedStatus,
          productPrice: updatedFormData.productPrice || 0,
          offerPrice: updatedFormData.offerPrice || 0,
        };

        const productUpdateResponse = await updateProductFull.mutateAsync(fullProductUpdateData);
        if (!productUpdateResponse.status) {
          toast({ title: t("product_update_failed"), description: productUpdateResponse?.message || "Failed to update product details", variant: "danger" });
          return;
        }

        const priceUpdateResponse = await updateProductPrice.mutateAsync(priceUpdateData);
        response = priceUpdateResponse;
        if (!priceUpdateResponse.status) {
          toast({ title: t("product_update_failed"), description: priceUpdateResponse?.message || "Failed to update product price details", variant: "danger" });
          return;
        }

        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "existing-products" });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["managed-products"] });
        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "product-by-id" });
        queryClient.refetchQueries({ predicate: (query) => query.queryKey[0] === "existing-products" });
      } else {
        response = await createProduct.mutateAsync(updatedFormData);
      }

      if (response && response.status && response.data) {
        if (!isEditMode) {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["all-products"] });
          queryClient.invalidateQueries({ queryKey: ["managed-products"] });
          queryClient.invalidateQueries({ queryKey: ["existing-products"] });
        }
        toast({
          title: isEditMode ? t("product_update_successful") : t("product_create_successful"),
          description: response.message,
          variant: "success",
        });
        form.reset();
        if (isEditMode) {
          setTimeout(() => router.push("/manage-products"), 100);
        } else if (activeProductType === "R") {
          router.push("/rfq");
        } else if (activeProductType === "F") {
          router.push("/factories");
        } else if (activeProductType === "D") {
          router.push("/dropship-products");
        } else {
          router.push("/manage-products");
        }
      } else {
        toast({
          title: isEditMode ? t("product_update_failed") : t("product_create_failed"),
          description: response?.message || "Unknown error occurred",
          variant: "danger",
        });
      }
    } catch (error: any) {
      toast({
        title: isEditMode ? t("product_update_failed") : t("product_create_failed"),
        description: error?.response?.data?.message || error?.message || "Network error occurred",
        variant: "danger",
      });
    }
  };

  return {
    onSubmit,
    createProduct,
    uploadMultiple,
    updateProductFull,
    updateProductPrice,
    handleUploadedFile,
  };
};
