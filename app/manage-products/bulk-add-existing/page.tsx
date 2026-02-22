"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, Eye } from "lucide-react";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { useExistingProductById } from "@/apis/queries/product.queries";
import { useCreateProduct } from "@/apis/queries/product.queries";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useUploadMultipleFile } from "@/apis/queries/upload.queries";
import { useTags } from "@/apis/queries/tags.queries";
import { useMe } from "@/apis/queries/user.queries";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import validator from "validator";
import { generateRandomSkuNoWithTimeStamp } from "@/utils/helper";

interface SelectedProduct {
  id: number;
  productName: string;
  productImage: string | null;
  productPrice: number;
  offerPrice: number;
  categoryName: string;
  brandName: string;
  shortDescription: string;
  skuNo?: string;
  description: string;
  specification: string;
  categoryLocation?: string;
  existingProductImages?: any[];
  existingProductTags?: any[];
  categoryId: number;
  brandId: number;
  typeOfProduct: string;
  productType: string;
}

const BulkAddExistingProductsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const me = useMe();
  
  // Get selected product IDs from URL params
  const selectedProductIds = searchParams?.get('ids')?.split(',').map(Number) || [];
  
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [bulkSettings, setBulkSettings] = useState({
    productPrice: 0,
    offerPrice: 0,
    stock: 0,
    deliveryAfter: 0,
    productCondition: "NEW",
    consumerType: "CONSUMER",
    sellType: "NORMALSELL",
    vendorDiscount: 0,
    consumerDiscount: 0,
    minQuantity: 0,
    maxQuantity: 0,
    minCustomer: 0,
    maxCustomer: 0,
    minQuantityPerCustomer: 0,
    maxQuantityPerCustomer: 0,
  });

  const uploadMultiple = useUploadMultipleFile();
  const createProduct = useCreateProduct();
  const tagsQuery = useTags();
  const queryClient = useQueryClient();



  // Use the existing product by ID hook for each selected product
  const productQueries = selectedProductIds.map(id => 
    useExistingProductById({ existingProductId: id.toString() }, selectedProductIds.length > 0)
  );

  // Process the results when all queries are complete
  useEffect(() => {
    if (selectedProductIds.length === 0) {
      toast({
        title: t("no_products_selected"),
        description: t("please_select_products_first"),
        variant: "destructive",
      });
      router.push("/manage-products");
      return;
    }

    const allLoaded = productQueries.every(query => query.isSuccess || query.isError);
    const isLoading = productQueries.some(query => query.isLoading);

    if (isLoading) {
      setLoading(true);
      return;
    }

    if (allLoaded) {
      setLoading(false);
      const validProducts = productQueries
        .filter(query => query.isSuccess && query.data?.data)
        .map(query => {
          const product = query.data.data;
          return {
            id: product.id,
            productName: product.productName,
            productImage: product.existingProductImages?.[0]?.image || null,
            productPrice: product.productPrice,
            offerPrice: product.offerPrice,
            categoryName: product.category?.name || "Unknown Category",
            brandName: product.brand?.brandName || "Unknown Brand",
            shortDescription: product.shortDescription || "",
            skuNo: product.skuNo || "",
            description: product.description || "",
            specification: product.specification || "",
            categoryLocation: product.categoryLocation || "",
            existingProductImages: product.existingProductImages || [],
            existingProductTags: product.existingProductTags || [],
            categoryId: product.categoryId,
            brandId: product.brandId,
            typeOfProduct: product.typeOfProduct || "P",
            productType: product.productType || "P",
          };
        });

      if (validProducts.length === 0) {
        toast({
          title: t("no_valid_products"),
          description: t("selected_products_not_found"),
          variant: "destructive",
        });
        router.push("/manage-products");
        return;
      }

      setSelectedProducts(validProducts);
    }
  }, [productQueries, selectedProductIds, router, toast, t]);

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleBulkAdd = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: t("no_products_selected"),
        description: t("please_select_products_to_add"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare all product data first
      const productDataPromises = selectedProducts.map(product => {
        const productData = {
          productName: product.productName,
          categoryId: product.categoryId,
          categoryLocation: product.categoryLocation || "",
          typeOfProduct: product.typeOfProduct,
          productType: product.productType as "R" | "P",
          brandId: product.brandId,
          productCountryId: 1, // Default country
          productStateId: 1, // Default state
          productCityId: 1, // Default city
          productTown: "",
          productLatLng: "",
          sellCountryIds: [],
          sellStateIds: [],
          sellCityIds: [],
          skuNo: generateRandomSkuNoWithTimeStamp().toString(),
          productCondition: bulkSettings.productCondition,
          productTagList: product.existingProductTags?.map(tag => ({
            tagId: tag.existingProductTag.id
          })) || [],
          productImagesList: product.existingProductImages?.map(img => ({
            imageName: img.imageName || 'product-image',
            image: img.image
          })) || [],
          productPrice: bulkSettings.productPrice || product.productPrice,
          offerPrice: bulkSettings.offerPrice || product.offerPrice,
          placeOfOriginId: 1, // Default origin
          productShortDescriptionList: product.shortDescription ? [{
            shortDescription: product.shortDescription
          }] : [],
          productSpecificationList: product.specification ? [{
            label: "Specification",
            specification: product.specification
          }] : [],
          description: product.description,
          descriptionJson: product.description ? [
            {
              id: '1',
              type: 'p',
              children: [{ text: product.description }]
            }
          ] : undefined,
          specification: product.specification || "",
          status: "ACTIVE" as "ACTIVE" | "INACTIVE",
          existingProductId: product.id, // Add the existing product ID
          productPriceList: [{
            consumerType: bulkSettings.consumerType,
            sellType: bulkSettings.sellType,
            consumerDiscount: bulkSettings.consumerDiscount,
            vendorDiscount: bulkSettings.vendorDiscount,
            consumerDiscountType: "PERCENTAGE",
            vendorDiscountType: "PERCENTAGE",
            minCustomer: bulkSettings.minCustomer,
            maxCustomer: bulkSettings.maxCustomer,
            minQuantityPerCustomer: bulkSettings.minQuantityPerCustomer,
            maxQuantityPerCustomer: bulkSettings.maxQuantityPerCustomer,
            minQuantity: bulkSettings.minQuantity,
            maxQuantity: bulkSettings.maxQuantity,
            dateOpen: "",
            dateClose: "",
            timeOpen: 0,
            timeClose: 0,
            startTime: "",
            endTime: "",
            deliveryAfter: bulkSettings.deliveryAfter,
            stock: bulkSettings.stock,
            productPrice: bulkSettings.productPrice > 0 ? bulkSettings.productPrice : product.productPrice,
            offerPrice: bulkSettings.offerPrice > 0 ? bulkSettings.offerPrice : product.offerPrice,
            productCondition: bulkSettings.productCondition,
          }],
          setUpPrice: true,
          isStockRequired: false,
          isOfferPriceRequired: false,
          isCustomProduct: false,
          productVariants: [],
        };
        return { productData, productName: product.productName };
      });

      // Execute all product creations in parallel
      const results = await Promise.allSettled(
        productDataPromises.map(async ({ productData, productName }) => {
          try {
            const result = await createProduct.mutateAsync(productData);
            return { product: productName, success: result.status };
          } catch (error) {
            return { product: productName, success: false, error };
          }
        })
      );

      // Process results
      const processedResults = results.map(result => 
        result.status === 'fulfilled' ? result.value : { product: 'Unknown', success: false, error: result.reason }
      );

      const successCount = processedResults.filter(r => r.success).length;
      const failureCount = processedResults.length - successCount;

      if (successCount > 0) {
        // Batch cache invalidation - do this only once at the end
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["managed-products"] }),
          queryClient.invalidateQueries({ queryKey: ["products"] }),
          queryClient.invalidateQueries({ queryKey: ["all-managed-products"] }),
          queryClient.invalidateQueries({ queryKey: ["existing-products"] }),
        ]);
        
        // Force refetch to ensure fresh data
        await queryClient.refetchQueries({ queryKey: ["managed-products"] });
        
        toast({
          title: t("bulk_add_successful"),
          description: t("successfully_added_products", { count: successCount }),
          variant: "success",
        });
      }

      if (failureCount > 0) {
        toast({
          title: t("some_products_failed"),
          description: t("failed_to_add_products", { count: failureCount }),
          variant: "destructive",
        });
      }

      // Navigate back to manage products with "My Products" tab active
      router.push("/manage-products?tab=my-products");
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failed_to_add_products_bulk"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && selectedProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading_products")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("back")}
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("bulk_add_products")}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {t("selected_products")}: {selectedProducts.length}
              </span>
              <Button
                onClick={handleBulkAdd}
                disabled={loading || selectedProducts.length === 0}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? t("adding_products") : t("add_all_products")}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bulk Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-xs p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("bulk_settings")}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">{t("product_price")}</Label>
                  <Input
                    type="number"
                    value={bulkSettings.productPrice}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      productPrice: Number(e.target.value)
                    }))}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("offer_price")}</Label>
                  <Input
                    type="number"
                    value={bulkSettings.offerPrice}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      offerPrice: Number(e.target.value)
                    }))}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("stock")}</Label>
                  <Input
                    type="number"
                    value={bulkSettings.stock}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      stock: Number(e.target.value)
                    }))}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("delivery_after_days")}</Label>
                  <Input
                    type="number"
                    value={bulkSettings.deliveryAfter}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      deliveryAfter: Number(e.target.value)
                    }))}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("product_condition")}</Label>
                  <select
                    value={bulkSettings.productCondition}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      productCondition: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="NEW">{t("new")}</option>
                    <option value="OLD">{t("old")}</option>
                    <option value="REFURBISHED">{t("refurbished")}</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("consumer_type")}</Label>
                  <select
                    value={bulkSettings.consumerType}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      consumerType: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="CONSUMER">{t("consumer")}</option>
                    <option value="BUSINESS">{t("business")}</option>
                    <option value="EVERYONE">{t("everyone")}</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("sell_type")}</Label>
                  <select
                    value={bulkSettings.sellType}
                    onChange={(e) => setBulkSettings(prev => ({
                      ...prev,
                      sellType: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="NORMALSELL">{t("normal_sell")}</option>
                    <option value="BUYGROUP">{t("buy_group")}</option>
                    <option value="EVERYONE">{t("everyone")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Products List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xs p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("selected_products")} ({selectedProducts.length})
              </h3>
              
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t("no_products_selected")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      {/* Product Image */}
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                        {product.productImage && validator.isURL(product.productImage) ? (
                          // Check if the image is from an allowed domain (S3 bucket)
                          product.productImage.includes('puremoon.s3.amazonaws.com') ? (
                            <Image
                              src={product.productImage}
                              alt="product-image"
                              fill
                              sizes="64px"
                              className="object-cover"
                              blurDataURL="/images/product-placeholder.png"
                              placeholder="blur"
                            />
                          ) : (
                            // Use regular img tag for external URLs not in allowed domains
                            <img
                              src={product.productImage}
                              alt="product-image"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = PlaceholderImage.src;
                              }}
                            />
                          )
                        ) : (
                          <Image
                            src={PlaceholderImage}
                            alt="product-image"
                            fill
                            sizes="64px"
                            className="object-cover"
                            blurDataURL="/images/product-placeholder.png"
                            placeholder="blur"
                          />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.productName}</h4>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span>{t("category")}: {product.categoryName}</span>
                          <span>{t("brand")}: {product.brandName}</span>
                          <span>{t("price")}: ${product.productPrice}</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProduct(product.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withActiveUserGuard(BulkAddExistingProductsPage);
