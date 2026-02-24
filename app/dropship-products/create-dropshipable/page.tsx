"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useExistingProduct } from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Copy, ArrowLeft, Eye, X, Truck } from "lucide-react";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import BannerImage from "@/public/images/rfq-sec-bg.png";
import Footer from "@/components/shared/Footer";

const CreateDropshipableProductPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const me = useMe();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewProduct, setViewProduct] = useState<any>(null);
  const [shouldSearch, setShouldSearch] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get productId from URL params
  const productId = searchParams?.get('productId');

  const { data: searchData, refetch: searchProducts, isError, error } = useExistingProduct(
    {
      page: 1,
      limit: 10,
      term: searchTerm,
      brandAddedBy: me.data?.data?.id,
    },
    shouldSearch && searchTerm.trim().length >= 3
  );

  const handleCreateFromScratch = () => {
    router.push("/product?productType=D");
  };

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      toast({
        title: t("please_enter_product_name"),
        description: t("search_term_too_short"),
        variant: "destructive",
      });
      return;
    }

    if (searchTerm.trim().length < 3) {
      toast({
        title: t("search_term_too_short"),
        description: t("search_term_too_short"),
        variant: "destructive",
      });
      return;
    }

    setShouldSearch(true); // Trigger the search
    setIsSearching(true);
    searchProducts(); // Manually refetch
  }, [searchTerm, toast, t, searchProducts]);

  const handleSelectProduct = (product: any) => {
    // Navigate directly to product creation page with existing product data
    const queryParams = new URLSearchParams({
      productType: 'D',
      fromExisting: 'true',
      existingProductId: product.id.toString(),
    });
    router.push(`/product?${queryParams.toString()}`);
  };

  const handleViewProduct = (product: any) => {
    setViewProduct(product);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewProduct(null);
  };

  // Auto-redirect to product form if productId is provided
  useEffect(() => {
    if (productId && !isRedirecting) {
      setIsRedirecting(true);
      const queryParams = new URLSearchParams({
        productType: 'D',
        fromExisting: 'true',
        existingProductId: productId,
      });
      router.push(`/product?${queryParams.toString()}`);
    }
  }, [productId, router, isRedirecting]);

  // Function to parse JSON description and convert to readable text
  const parseDescription = (description: string) => {
    try {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed)) {
        return parsed
          .map((block: any) => {
            if (block.children && Array.isArray(block.children)) {
              return block.children.map((child: any) => child.text || '').join('');
            }
            return '';
          })
          .join('\n\n');
      }
      return description;
    } catch (error) {
      // If parsing fails, return the original description
      return description;
    }
  };



  useEffect(() => {
    if (searchData?.data?.data) {
      setSearchResults(searchData.data.data);
      setIsSearching(false);
    } else if (searchData?.data) {
      // Handle case where data is directly in searchData.data
      setSearchResults(searchData.data);
      setIsSearching(false);
    }
  }, [searchData]);

  useEffect(() => {
    if (error) {
      setIsSearching(false);
      toast({
        title: t("search_failed"),
        description: t("please_try_again"),
        variant: "destructive",
      });
    }
  }, [error, toast, t]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Show loading state when redirecting
  if (isRedirecting) {
    return (
      <>
        <title dir={langDir} translate="no">{`${t("create_dropshipable_product")} | Ultrasooq`}</title>
        <section className="rfq_section">
          <div className="sec-bg relative">
            <Image src={BannerImage} alt="background-banner" fill />
          </div>
          <div className="rfq-container px-3">
            <div className="row">
              <div className="rfq_main_box justify-center!">
                <div className="rfq_middle">
                  <div className="bg-card p-8 rounded-lg shadow-sm text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Truck className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {t("redirecting_to_form")}
                      </h2>
                      <p className="text-muted-foreground">
                        {t("preparing_dropship_form")}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <title dir={langDir} translate="no">{`${t("create_dropshipable_product")} | Ultrasooq`}</title>
      <section className="rfq_section">
        <div className="sec-bg relative">
          <Image src={BannerImage} alt="background-banner" fill />
        </div>
        <div className="rfq-container px-3">
          <div className="row">
            <div className="rfq_main_box justify-center!">
              <div className="rfq_left" dir={langDir}>
                {/* Left sidebar content can be added here if needed */}
              </div>
              <div className="rfq_middle">
                {/* Header Section */}
                <div className="mb-6 bg-card p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h1 className="text-xl font-semibold text-foreground">
                            {t("create_dropshipable_product")}
                          </h1>
                          <p className="text-sm text-muted-foreground">
                            {t("create_dropshipable_product_description")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search Section */}
                  <div className="mb-6">
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder={t("search_existing_product")}
                          className="h-12"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={handleKeyPress}
                          dir={langDir}
                          translate="no"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleSearch}
                        disabled={!searchTerm.trim() || isSearching}
                        className="h-12 px-6 bg-primary hover:bg-primary/90 disabled:bg-muted-foreground disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        {isSearching ? t("searching") : t("search")}
                      </Button>
                    </div>

                    {/* Create from scratch button */}
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        onClick={handleCreateFromScratch}
                        variant="outline"
                        className="h-12 px-6 border-primary text-primary hover:bg-primary/5 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
{t("add_dropshipable_product")}
                      </Button>
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-foreground mb-4">
                        {t("search_results")} ({searchResults.length})
                      </h3>
                      <div className="space-y-3">
                        {searchResults.map((product: any) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
                                {product.existingProductImages?.[0]?.image ? (
                                  (() => {
                                    const imageSrc = product.existingProductImages[0].image;
                                    const isExternalUrl = imageSrc && 
                                      typeof imageSrc === "string" && 
                                      imageSrc.startsWith("http") && 
                                      !imageSrc.includes("ultrasooq.s3.amazonaws.com");
                                    
                                    return isExternalUrl ? (
                                      <img
                                        src={imageSrc}
                                        alt={product.productName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = "/images/no-image.jpg";
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
                                  <div className="text-muted-foreground text-xs text-center">
                                    {t("no_image")}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">
                                  {product.productName}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  SKU: {product.skuNo}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {t("price")}: ${product.productPrice || product.product_productPrice?.[0]?.productPrice || "0.00"}
                                </p>
                                {product.category && (
                                  <p className="text-sm text-muted-foreground">
                                    {t("category")}: {product.category.name || product.category.categoryName}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProduct(product)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                {t("view")}
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() => handleSelectProduct(product)}
                                className="flex items-center gap-1 bg-primary hover:bg-primary/90"
                              >
                                <Plus className="w-4 h-4" />
                                {t("select")}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchTerm && searchResults.length === 0 && !isSearching && (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground mb-4">
                        <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{t("no_products_found")}</p>
                        <p className="text-sm">{t("try_different_search_term")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Product View Modal */}
      {showViewModal && viewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {t("product_details")}
              </h3>
              <button
                onClick={handleCloseViewModal}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Images */}
              <div>
                <h4 className="font-medium text-foreground mb-2">{t("product_images")}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {viewProduct.existingProductImages?.map((image: any, index: number) => {
                    const imageSrc = image.image;
                    const isExternalUrl = imageSrc && 
                      typeof imageSrc === "string" && 
                      imageSrc.startsWith("http") && 
                      !imageSrc.includes("ultrasooq.s3.amazonaws.com");
                    
                    return (
                      <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                        {imageSrc ? (
                          isExternalUrl ? (
                            <img
                              src={imageSrc}
                              alt={`${viewProduct.productName} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/images/no-image.jpg";
                              }}
                            />
                          ) : (
                            <Image
                              src={imageSrc}
                              alt={`${viewProduct.productName} - Image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            {t("no_image")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!viewProduct.existingProductImages || viewProduct.existingProductImages.length === 0) && (
                    <div className="col-span-2 aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-muted-foreground text-center">
                        <div className="text-lg mb-2">📷</div>
                        <div className="text-sm">{t("no_images_available")}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div>
                <h4 className="font-medium text-foreground mb-4">{t("product_information")}</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-muted-foreground">{t("product_name")}:</span>
                    <p className="text-foreground">{viewProduct.productName}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">{t("price")}:</span>
                    <p className="text-foreground">${viewProduct.productPrice || "0.00"}</p>
                  </div>

                  {viewProduct.offerPrice && viewProduct.offerPrice !== viewProduct.productPrice && (
                    <div>
                      <span className="font-medium text-muted-foreground">{t("offer_price")}:</span>
                      <p className="text-success font-medium">${viewProduct.offerPrice}</p>
                    </div>
                  )}
                  
                  {viewProduct.category && (
                    <div>
                      <span className="font-medium text-muted-foreground">{t("category")}:</span>
                      <p className="text-foreground">{viewProduct.category.name || viewProduct.category.categoryName}</p>
                    </div>
                  )}
                  
                  {viewProduct.brand && (
                    <div>
                      <span className="font-medium text-muted-foreground">{t("brand")}:</span>
                      <p className="text-foreground">{viewProduct.brand.brandName}</p>
                    </div>
                  )}
                </div>


                {/* Description */}
                {viewProduct.description && (
                  <div className="mt-4">
                    <span className="font-medium text-muted-foreground mb-2 block">{t("description")}:</span>
                    <div className="text-foreground text-sm whitespace-pre-wrap">
                      {parseDescription(viewProduct.description)}
                    </div>
                  </div>
                )}

                {/* Short Description */}
                {viewProduct.shortDescription && (
                  <div className="mt-4">
                    <span className="font-medium text-muted-foreground mb-2 block">{t("short_description")}:</span>
                    <p className="text-foreground text-sm">{viewProduct.shortDescription}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseViewModal}
              >
                {t("close")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleCloseViewModal();
                  // Navigate directly to product creation page with existing product data
                  const queryParams = new URLSearchParams({
                    productType: 'D',
                    fromExisting: 'true',
                    existingProductId: viewProduct.id.toString(),
                  });
                  router.push(`/product?${queryParams.toString()}`);
                }}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t("select_this_product")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default withActiveUserGuard(CreateDropshipableProductPage);
