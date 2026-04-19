"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTags } from "@/apis/queries/tags.queries";
import { useSearchParams } from "next/navigation";
import {
  useProductById,
  useExistingProductById,
  useOneProductByProductCondition,
  useUpdateSingleProduct,
  useUpdateProduct,
  useCreateProduct,
} from "@/apis/queries/product.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useUploadMultipleFile } from "@/apis/queries/upload.queries";
import Footer from "@/components/shared/Footer";
import ProductWizard from "@/components/modules/createProduct/wizard/ProductWizard";
import dynamic from "next/dynamic";

const DropshipProductForm = dynamic(
  () => import("@/components/modules/createProduct/DropshipProductForm"),
  { ssr: false },
);

import { formSchemaForTypeP, formSchemaForTypeR } from "./_components/productFormSchema";
import { defaultValues } from "./_components/productDefaultValues";
import { useEditProductForm } from "./_components/useEditProductForm";
import { useProductDataSync } from "./_components/useProductDataSync";
import { useProductSubmit } from "./_components/useProductSubmit";
import ProductLoadingStates from "./_components/ProductLoadingStates";
import ProductPageHeader from "./_components/ProductPageHeader";
import { useTranslations } from "next-intl";

const CreateProductPage = () => {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const productId: string | null =
    searchParams?.get("copy") ||
    searchParams?.get("productId") ||
    searchParams?.get("existingProductId") ||
    null;
  const isEditMode = searchParams?.get("edit") === "true";
  const editProductPriceId = searchParams?.get("productPriceId");

  // ── Local state ───────────────────────────────────────────────────────────
  const [activeProductType, setActiveProductType] = useState<string>();
  const [activeTab, setActiveTab] = useState<"create" | "dropship">("create");
  const [isClient, setIsClient] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Mount flag
  useEffect(() => { setIsClient(true); }, []);

  // Tab from URL
  useEffect(() => {
    if (isClient && searchParams) {
      const tab = searchParams.get("tab");
      const productType = searchParams.get("productType");
      setActiveTab(tab === "dropship" || productType === "D" ? "dropship" : "create");
    }
  }, [isClient, searchParams]);

  // Product type from URL
  useEffect(() => {
    const params = new URLSearchParams(document.location.search);
    const pt = params.get("productType");
    setActiveProductType(pt || "P");
  }, []);

  useEffect(() => {
    if (activeProductType === "R") form.setValue("typeOfProduct", "BRAND");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProductType]);

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm({
    resolver: zodResolver(
      activeProductType === "R" ? formSchemaForTypeR(t) : formSchemaForTypeP(t),
    ) as any,
    defaultValues,
  });

  const watchProductImages = form.watch("productImages");
  const watchSetUpPrice = form.watch("setUpPrice");

  useEffect(() => {
    if (!watchSetUpPrice) {
      form.setValue("productPrice", 0);
      form.setValue("offerPrice", 0);
      form.setValue("productPriceList", [
        {
          consumerType: "", sellType: "", consumerDiscount: 0, vendorDiscount: 0,
          consumerDiscountType: "", vendorDiscountType: "", minCustomer: 0,
          maxCustomer: 0, minQuantityPerCustomer: 0, maxQuantityPerCustomer: 0,
          minQuantity: 0, maxQuantity: 0, dateOpen: "", dateClose: "",
          timeOpen: 0, timeClose: 0, startTime: "", endTime: "", deliveryAfter: 0, stock: 0,
        },
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchSetUpPrice, form.setValue]);

  useEffect(() => {
    const productType = searchParams?.get("productType");
    if (productType === "D") form.setValue("isDropshipable", true);
  }, [isClient, searchParams, form]);

  // ── Server queries ────────────────────────────────────────────────────────
  const editProductQuery = useOneProductByProductCondition(
    {
      productId: parseInt(productId || "0"),
      productPriceId: parseInt(editProductPriceId || "0"),
    },
    isEditMode && !!editProductPriceId && !!productId,
  );

  const productQueryById = useProductById(
    { productId: productId || "" },
    !!productId && (!searchParams?.get("copy") || searchParams?.get("fromExisting") !== "true"),
  );

  const existingProductQueryById = useExistingProductById(
    { existingProductId: productId || "" },
    !!productId && searchParams?.get("fromExisting") === "true",
  );

  const tagsQuery = useTags();
  const { data: currentAccount } = useCurrentAccount();
  const uploadMultiple = useUploadMultipleFile();
  const createProduct = useCreateProduct();
  const updateProductPrice = useUpdateSingleProduct();
  const updateProductFull = useUpdateProduct();

  const memoizedTags = useMemo(
    () =>
      tagsQuery?.data?.data.map((item: { id: string; tagName: string }) => ({
        label: item.tagName,
        value: item.id,
      })) || [],
    [tagsQuery?.data],
  );

  // ── Edit-mode pre-fill ────────────────────────────────────────────────────
  useEditProductForm({
    isEditMode,
    editProductData: editProductQuery.data?.data,
    form,
    setSelectedCategoryIds,
    setActiveProductType,
  });

  // ── Copy / existing-product pre-fill ─────────────────────────────────────
  useProductDataSync({
    form,
    productQueryByIdData: productQueryById?.data?.data,
    existingProductQueryByIdData: existingProductQueryById?.data?.data,
    searchParams,
    setActiveProductType,
    setSelectedCategoryIds,
    t,
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  const { onSubmit } = useProductSubmit({
    form,
    activeProductType,
    watchProductImages,
    isEditMode,
    editProductQuery,
    productId,
    productQueryByIdData: productQueryById?.data?.data,
  });

  // ── Loading / error guards ────────────────────────────────────────────────
  const earlyReturn = (
    <ProductLoadingStates
      isClient={isClient}
      isEditMode={isEditMode}
      isLoading={editProductQuery.isLoading}
      isError={!!editProductQuery.error}
      activeProductType={activeProductType}
    />
  );
  if (!isClient || (isEditMode && (editProductQuery.isLoading || editProductQuery.error))) {
    return earlyReturn;
  }

  const showTabs =
    !searchParams?.get("productType") ||
    (searchParams?.get("productType") !== "D" && searchParams?.get("productType") !== "R");

  return (
    <>
      <section className="min-h-screen bg-muted py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <ProductPageHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showTabs={showTabs}
          />

          <div className="mx-auto max-w-5xl">
            {activeTab === "dropship" && searchParams?.get("productType") !== "D" ? (
              <DropshipProductForm />
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <ProductWizard
                    form={form}
                    tagsList={memoizedTags}
                    activeProductType={activeProductType}
                    selectedCategoryIds={selectedCategoryIds}
                    setSelectedCategoryIds={setSelectedCategoryIds}
                    isEditMode={isEditMode}
                    copy={
                      !!(searchParams?.get("copy") && productQueryById?.data?.data)
                    }
                    isSubmitting={
                      createProduct.isPending ||
                      uploadMultiple.isPending ||
                      updateProductFull.isPending ||
                      updateProductPrice.isPending
                    }
                    onSubmit={() => form.trigger()}
                  />
                </form>
              </Form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CreateProductPage;
