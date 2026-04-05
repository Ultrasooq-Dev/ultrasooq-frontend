"use client";
import React, { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Building2, Package, Star, ChevronLeft, ChevronRight, ExternalLink, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "./ProductCard";
import { debounce } from "lodash";

type Vendor = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  tradeRole: string;
  userProfile?: any[];
  productCount: number;
  averageRating?: number;
  location?: string;
  businessTypes?: string[];
};

type VendorsSectionProps = {
  vendors: Vendor[];
  isLoading?: boolean;
  products?: any[]; // Add products prop
  haveAccessToken?: boolean;
  cartList?: any[];
  onWishlist?: (productId: number, wishlistArr?: any[]) => void;
};

const VendorsSection: React.FC<VendorsSectionProps> = ({ 
  vendors, 
  isLoading = false,
  products = [],
  haveAccessToken = false,
  cartList = [],
  onWishlist
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Debounced search
  const handleSearch = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);

  // Filter vendors based on search term
  const filteredVendors = useMemo(() => {
    if (!searchTerm) return vendors;
    
    return vendors.filter(vendor => 
      `${vendor.firstName} ${vendor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.tradeRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.businessTypes?.some(type => 
        type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [vendors, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVendors = filteredVendors.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Group products by vendor
  const productsByVendor = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    products.forEach(product => {
      if (product.vendorId) {
        if (!grouped[product.vendorId]) {
          grouped[product.vendorId] = [];
        }
        grouped[product.vendorId].push(product);
      }
    });
    
    return grouped;
  }, [products]);

  // Calculate summary statistics
  const totalVendors = vendors.length;
  const totalProducts = vendors.reduce((sum, vendor) => sum + vendor.productCount, 0);
  const averageRating = vendors.length > 0 
    ? vendors.reduce((sum, vendor) => sum + (vendor.averageRating || 0), 0) / vendors.length 
    : 0;

  if (isLoading) {
    return (
      <div className="py-6 sm:py-12">
        <div className="w-full">
          <div className="mb-4 sm:mb-8">
            <div className="h-6 w-32 sm:h-8 sm:w-64 bg-muted rounded animate-pulse mb-2 sm:mb-4"></div>
            <div className="h-3 w-48 sm:h-4 sm:w-96 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="space-y-4 sm:space-y-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-card rounded-lg shadow-xs p-3 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-24 sm:h-4 sm:w-32 bg-muted rounded animate-pulse"></div>
                    <div className="h-2 w-16 sm:h-3 sm:w-24 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-4 overflow-x-hidden">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 w-32 sm:h-32 sm:w-48 bg-muted rounded animate-pulse shrink-0"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!vendors.length) {
    return (
      <div className="py-8 sm:py-12">
        <div className="w-full text-center">
          <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1 sm:mb-2">
            {t("no_vendors_found")}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("no_vendors_available_description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                {t("vendors")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("discover_trusted_vendors_and_their_products")}
              </p>
            </div>
            <div className="w-full md:w-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t("search_vendors")}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full md:w-64"
                  dir={langDir}
                />
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>


        </div>

        {/* Vendors with Products */}
        <div className="space-y-4 sm:space-y-8">
          {paginatedVendors.map((vendor) => {
            const vendorProducts = productsByVendor[vendor.id] || [];
            
            return (
              <VendorWithProducts
                key={vendor.id}
                vendor={vendor}
                products={vendorProducts}
                haveAccessToken={haveAccessToken}
                cartList={cartList}
                onWishlist={onWishlist}
              />
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-8 flex flex-col gap-3 sm:gap-0 sm:flex-row items-center justify-between">
            {/* Items per page selector */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">
                {t("show")}:
              </span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-16 h-8 sm:w-20 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">
                {t("per_page")}
              </span>
            </div>

            {/* Pagination info */}
            <div className="text-xs sm:text-sm text-muted-foreground order-3 sm:order-2">
              {t("showing")} {startIndex + 1} - {Math.min(endIndex, filteredVendors.length)} {t("of")} {filteredVendors.length}
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 h-8 px-2 sm:h-10 sm:px-3"
              >
                <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">{t("first")}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 sm:h-10 sm:w-10 p-0"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 2) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNumber = totalPages - 2 + i;
                  } else {
                    pageNumber = currentPage - 1 + i;
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="h-8 w-8 sm:h-10 sm:w-10 p-0 text-xs sm:text-sm"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 sm:h-10 sm:w-10 p-0"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 h-8 px-2 sm:h-10 sm:px-3"
              >
                <span className="hidden sm:inline text-xs sm:text-sm">{t("last")}</span>
                <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Vendor with Products Component
const VendorWithProducts: React.FC<{
  vendor: Vendor;
  products: any[];
  haveAccessToken?: boolean;
  cartList?: any[];
  onWishlist?: (productId: number, wishlistArr?: any[]) => void;
}> = ({ vendor, products, haveAccessToken = false, cartList = [], onWishlist }) => {
  const t = useTranslations();
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-xs p-3 sm:p-6">
      {/* Vendor Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            {vendor.profilePicture ? (
              <img
                src={vendor.profilePicture}
                alt={vendor.firstName}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-xl font-semibold text-foreground truncate">
              {vendor.firstName} {vendor.lastName}
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
              <span className="capitalize">{vendor.tradeRole.toLowerCase()}</span>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{vendor.productCount} {t("products")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
                <span>{(vendor.averageRating || 0).toFixed(1)}</span>
              </div>
            </div>
            {vendor.businessTypes && vendor.businessTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
                {vendor.businessTypes.slice(0, 3).map((type, index) => (
                  <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs">
                    {type}
                  </Badge>
                ))}
                {vendor.businessTypes.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    +{vendor.businessTypes.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap w-full sm:w-auto">
          <span>{t("view_products")}</span>
          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* Products Horizontal Scroll */}
      {products.length > 0 ? (
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-4 scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >
            {products.map((product) => {
              const cartItem = cartList?.find(
                (el: any) => el.productId == product.id,
              );
              let relatedCart: any = null;
              if (cartItem) {
                relatedCart = cartList
                  ?.filter(
                    (c: any) =>
                      c.serviceId && c.cartProductServices?.length,
                  )
                  ?.find((c: any) => {
                    return !!c.cartProductServices
                      .find((r: any) => r.relatedCartType == 'PRODUCT' && r.productId == product.id);
                  });
              }
              
              return (
                <div key={product.id} className="shrink-0 w-48 sm:w-64">
                  <div className="vendor-product-card">
                    <style jsx global>{`
                      .vendor-product-card > div {
                        flex-direction: column !important;
                      }
                      .vendor-product-card > div > a {
                        width: 100% !important;
                      }
                      .vendor-product-card > div > a > div.relative {
                        height: 160px !important;
                      }
                      @media (min-width: 640px) {
                        .vendor-product-card > div > a > div.relative {
                          height: 192px !important;
                        }
                      }
                      .vendor-product-card div.absolute.z-20.rounded-full {
                        left: auto !important;
                        right: 4px !important;
                        top: 4px !important;
                      }
                      @media (min-width: 640px) {
                        .vendor-product-card div.absolute.z-20.rounded-full {
                          right: 12px !important;
                          top: 12px !important;
                        }
                      }
                    `}</style>
                    <ProductCard
                      productVariants={[]}
                      item={product}
                      onWishlist={() => onWishlist?.(product.id, product?.productWishlist)}
                      inWishlist={product?.inWishlist || false}
                      haveAccessToken={haveAccessToken}
                      isInteractive={true}
                      productQuantity={cartItem?.quantity || 0}
                      productVariant={cartItem?.object}
                      cartId={cartItem?.id}
                      relatedCart={relatedCart}
                      isAddedToCart={cartItem ? true : false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Scroll Buttons */}
          {products.length > 2 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 bg-card shadow-lg h-8 w-8 sm:h-10 sm:w-10 p-0"
                onClick={() => scroll('left')}
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 bg-card shadow-lg h-8 w-8 sm:h-10 sm:w-10 p-0"
                onClick={() => scroll('right')}
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs sm:text-sm">{t("this_vendor_has_no_products_available")}</p>
        </div>
      )}
    </div>
  );
};

export default VendorsSection;