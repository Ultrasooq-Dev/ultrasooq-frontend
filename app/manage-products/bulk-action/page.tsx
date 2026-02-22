"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAllManagedProducts, useUpdateMultipleProductPrice } from "@/apis/queries/product.queries";
import ManageProductCard from "@/components/modules/manageProducts/ManageProductCard";
import BulkEditSidebar from "@/components/modules/manageProducts/BulkEditSidebar";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { PERMISSION_PRODUCTS, checkPermission } from "@/helpers/permission";
import { FormProvider, useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";

const BulkActionPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasPermission = checkPermission(PERMISSION_PRODUCTS);
  const { toast } = useToast();
  
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [debugMode, setDebugMode] = useState(true); // Set to false to enable page reload
  const prevProductIdsRef = useRef<string | null>(null);

  // Bulk update mutation
  const updateMultipleProductPriceMutation = useUpdateMultipleProductPrice();

  // Create a form instance for the CounterTextInputField components
  const form = useForm({
    defaultValues: {
      // Add any default values needed for CounterTextInputField components
    },
  });

  // Get product IDs from URL params
  const productIdsParam = searchParams?.get('ids');
  const productIds = useMemo(() => {
    return productIdsParam ? productIdsParam.split(',').map(Number) : [];
  }, [productIdsParam]);

  // Fetch all products to get the selected ones
  const allProductsQuery = useAllManagedProducts(
    {
      page: 1,
      limit: 1000, // Get all products to filter
      term: "",
      selectedAdminId: undefined,
      brandIds: "",
      status: "",
      expireDate: "",
      sellType: "",
      discount: false,
    },
    hasPermission,
  );

  // Filter selected products based on IDs from URL
  useEffect(() => {
    if (allProductsQuery.data?.data && productIds.length > 0) {
      // Only update if productIds have actually changed
      if (prevProductIdsRef.current !== productIdsParam) {
      const filtered = allProductsQuery.data.data.filter((product: any) => 
        productIds.includes(product.id)
      );
      setSelectedProducts(filtered);
        prevProductIdsRef.current = productIdsParam || null;
      }
    }
  }, [allProductsQuery.data, productIds, productIdsParam]);

  // Handle bulk update
  const handleBulkUpdate = async (updateData: any) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select products to update",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Prepare the payload for bulk update according to backend DTO
      const productPriceArray = selectedProducts.map(product => {
        const productPriceData: any = {
          productPriceId: product.id,
        };

        // Only include fields that are being updated
        if (updateData.productPrice !== undefined) productPriceData.productPrice = updateData.productPrice;
        if (updateData.offerPrice !== undefined) productPriceData.offerPrice = updateData.offerPrice;
        if (updateData.stock !== undefined) productPriceData.stock = updateData.stock;
        
        // Add required fields that might be missing
        productPriceData.askForPrice = product.askForPrice || "false";
        productPriceData.askForStock = product.askForStock || "false";
        
        // Basic fields
        if (updateData.sellCountryIds !== undefined) productPriceData.sellCountryIds = updateData.sellCountryIds;
        if (updateData.sellStateIds !== undefined) productPriceData.sellStateIds = updateData.sellStateIds;
        if (updateData.sellCityIds !== undefined) productPriceData.sellCityIds = updateData.sellCityIds;
        if (updateData.placeOfOriginId !== undefined) productPriceData.placeOfOriginId = updateData.placeOfOriginId;
        if (updateData.enableChat !== undefined) productPriceData.enableChat = updateData.enableChat;
        if (updateData.productCondition !== undefined) productPriceData.productCondition = updateData.productCondition;
        if (updateData.askForPrice !== undefined) productPriceData.askForPrice = updateData.askForPrice;
        if (updateData.askForSell !== undefined) productPriceData.askForSell = updateData.askForSell;
        
        // Other fields
        if (updateData.deliveryAfter !== undefined) productPriceData.deliveryAfter = Number(updateData.deliveryAfter);
        if (updateData.consumerType !== undefined) productPriceData.consumerType = updateData.consumerType;
        if (updateData.sellType !== undefined) productPriceData.sellType = updateData.sellType;
        if (updateData.vendorDiscount !== undefined) productPriceData.vendorDiscount = Number(updateData.vendorDiscount);
        if (updateData.vendorDiscountType !== undefined) productPriceData.vendorDiscountType = updateData.vendorDiscountType;
        if (updateData.consumerDiscount !== undefined) productPriceData.consumerDiscount = Number(updateData.consumerDiscount);
        if (updateData.consumerDiscountType !== undefined) productPriceData.consumerDiscountType = updateData.consumerDiscountType;
        if (updateData.minQuantity !== undefined) productPriceData.minQuantity = Number(updateData.minQuantity);
        if (updateData.maxQuantity !== undefined) productPriceData.maxQuantity = Number(updateData.maxQuantity);
        if (updateData.minCustomer !== undefined) productPriceData.minCustomer = Number(updateData.minCustomer);
        if (updateData.maxCustomer !== undefined) productPriceData.maxCustomer = Number(updateData.maxCustomer);
        if (updateData.minQuantityPerCustomer !== undefined) productPriceData.minQuantityPerCustomer = Number(updateData.minQuantityPerCustomer);
        if (updateData.maxQuantityPerCustomer !== undefined) productPriceData.maxQuantityPerCustomer = Number(updateData.maxQuantityPerCustomer);
        if (updateData.timeOpen !== undefined) productPriceData.timeOpen = Number(updateData.timeOpen);
        if (updateData.timeClose !== undefined) productPriceData.timeClose = Number(updateData.timeClose);

        return productPriceData;
      });
      
      const payload = {
        productPrice: productPriceArray
      };
      
      // Call the actual API
      const result = await updateMultipleProductPriceMutation.mutateAsync(payload);
      
      // Check if the API call was actually successful
      if (result?.status && result?.data) {
        
        // Show success message with updated values
        const updatedFields = Object.keys(updateData).filter(key => 
          updateData[key] !== undefined && updateData[key] !== "" && updateData[key] !== 0
        );
        
        toast({
          title: "Success!",
          description: `Successfully updated ${selectedProducts.length} products. Updated fields: ${updatedFields.join(", ")}`,
          variant: "default",
        });
        
        // Refresh the page to show updated data (increased delay to see console logs)
        if (!debugMode) {
          setTimeout(() => {
            window.location.reload();
          }, 5000); // Increased from 1000ms to 5000ms (5 seconds)
        } else {
          // Refresh the product data even in debug mode
          allProductsQuery.refetch();
        }
      } else {
        throw new Error("API returned unsuccessful response");
      }
      
    } catch (error: any) {
      
      toast({
        title: "Update Failed",
        description: `Error updating products: ${error?.response?.data?.message || error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Redirect if no permission
  useEffect(() => {
    if (!hasPermission) {
      router.push("/home");
    }
  }, [hasPermission, router]);

  // Redirect if no products selected
  useEffect(() => {
    if (productIds.length === 0) {
      router.push("/manage-products");
    }
  }, [productIds, router]);

  if (!hasPermission) return <div></div>;

  if (allProductsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (selectedProducts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg mb-4">No products found</div>
          <button
            onClick={() => router.push("/manage-products")}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary"
          >
            Back to Manage Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Bulk Action
              </h1>
              <p className="text-muted-foreground mt-2">
                Managing Products: {selectedProducts.length} products selected
              </p>
            </div>
            <button
              onClick={() => router.push("/manage-products")}
              className="flex items-center gap-2 px-4 py-2 bg-muted-foreground text-white rounded hover:bg-muted-foreground/90 transition-colors"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
              Back to Manage Products
            </button>
          </div>
        </div>

        {/* Main Content */}
        <FormProvider {...form}>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Products List - Left Side */}
              <div className="lg:w-2/3">
                <div className="bg-card rounded-lg shadow-xs p-6">
                  <h2 className="text-xl font-semibold mb-4">
                  Selected Products ({selectedProducts.length})
                  </h2>
                  
                  <div className="space-y-4">
                    {selectedProducts.map((product: any) => (
                      <ManageProductCard
                        key={product.id}
                        selectedIds={[]} // Empty array to hide checkboxes
                        onSelectedId={() => {}} // No-op function
                      onSelect={() => {}}
                        id={product.id}
                        productId={product.productId}
                        status={product.status}
                        askForPrice={product.askForPrice}
                        askForStock={product.askForStock}
                        productImage={
                          product?.productPrice_productSellerImage?.length
                            ? product?.productPrice_productSellerImage?.[0]?.image
                            : product?.productPrice_product?.productImages?.[0]?.image
                        }
                        productName={product?.productPrice_product?.productName}
                        productPrice={product?.productPrice}
                        offerPrice={product?.offerPrice}
                        deliveryAfter={product?.deliveryAfter}
                        stock={product?.stock}
                        consumerType={product?.consumerType}
                        sellType={product?.sellType}
                        timeOpen={product?.timeOpen}
                        timeClose={product?.timeClose}
                        vendorDiscount={product?.vendorDiscount}
                        vendorDiscountType={product?.vendorDiscountType}
                        consumerDiscount={product?.consumerDiscount}
                        consumerDiscountType={product?.consumerDiscountType}
                        minQuantity={product?.minQuantity}
                        maxQuantity={product?.maxQuantity}
                        minCustomer={product?.minCustomer}
                        maxCustomer={product?.maxCustomer}
                        minQuantityPerCustomer={product?.minQuantityPerCustomer}
                        maxQuantityPerCustomer={product?.maxQuantityPerCustomer}
                        productCondition={product?.productCondition}
                        onRemove={() => {}} // No-op function to hide remove button
                        hideCheckbox={true}
                        hideEyeIcon={true}
                        hideCopyButton={true}
                        hideActionButtons={true}
                      disableFields={true}
                      />
                    ))}
                  </div>
                </div>
              </div>

            {/* Bulk Edit Sidebar - Right Side */}
              <div className="lg:w-1/3">
                <div className="sticky top-6">
              <BulkEditSidebar
                onBulkUpdate={handleBulkUpdate}
                selectedProducts={selectedProducts.map(product => product.id)}
                onUpdate={() => allProductsQuery.refetch()}
                isLoading={isUpdating || updateMultipleProductPriceMutation.isPending}
              />
              </div>
            </div>
          </div>
        </FormProvider>
      </div>
    </div>
  );
};

export default withActiveUserGuard(BulkActionPage);
