"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, DollarSign, MapPin } from "lucide-react";
import Image from "next/image";
import { useAvailableProductsForDropship } from "@/apis/queries/dropship.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface ProductSearchSelectorProps {
  onProductSelect: (product: any) => void;
  selectedProduct: any;
}


const ProductSearchSelector: React.FC<ProductSearchSelectorProps> = ({
  onProductSelect,
  selectedProduct
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(true); // Show all products by default

  // Function to extract plain text from rich text (HTML/JSON) format
  const extractPlainText = (richText: any): string => {
    if (!richText) return '';

    let content = richText;

    // If it's a string, try to parse it as JSON first
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        // If parsing is successful and it's an object/array, use the parsed content
        if (typeof parsed === 'object' && parsed !== null) {
          content = parsed;
        } else {
          // It's a plain string, not JSON
          if (content.includes('<') && content.includes('>')) {
            // Remove HTML tags
            return content.replace(/<[^>]*>/g, '').trim();
          }
          return content;
        }
      } catch (e) {
        // Not a JSON string, treat as plain text or HTML
        if (content.includes('<') && content.includes('>')) {
          // Remove HTML tags
          return content.replace(/<[^>]*>/g, '').trim();
        }
        return content;
      }
    }

    // Now process the content (could be parsed JSON or original object/array)
    if (Array.isArray(content)) {
      return content.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          // Handle Plate.js format with text property
          if (item.text) return item.text;
          // Handle nested children
          if (item.children) {
            return extractPlainText(item.children);
          }
        }
        return '';
      }).filter(Boolean).join(' ').trim();
    }

    // If it's an object, try to extract text
    if (content && typeof content === 'object') {
      if (content.text) return content.text;
      if (content.children) return extractPlainText(content.children);
    }

    return '';
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: productsData, isLoading } = useAvailableProductsForDropship(
    {
      page: 1,
      limit: 20,
      term: debouncedSearchTerm,
    },
    showAllProducts || (hasSearched && debouncedSearchTerm.length > 2) // Show all products by default OR when user searches
  );

  const products = productsData?.data || [];


  const handleProductSelect = (product: any) => {
    onProductSelect(product);
  };

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t("search_products_to_dropship")}
            disabled
            className="pl-10"
          />
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={t("search_products_to_dropship")}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value.length > 2) {
              setHasSearched(true);
              setShowAllProducts(false); // Hide all products when searching
            } else {
              setHasSearched(false);
              setShowAllProducts(true); // Show all products when search is cleared
            }
          }}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Search Results */}
      {products && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedProduct?.id === product.id 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => handleProductSelect(product)}
            >
              <CardContent className="p-4">
                {/* Product Image */}
                <div className="aspect-square mb-3 relative overflow-hidden rounded-lg bg-gray-100">
                  {product.productImages?.[0] ? (
                    <Image
                      src={product.productImages[0].image}
                      alt={product.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {product.productName}
                  </h4>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {extractPlainText(product.description)}
                  </p>

                  {/* Pricing */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-green-600">
                      ${Number(product.productPrice).toFixed(2)}
                    </span>
                    {product.offerPrice && Number(product.offerPrice) < Number(product.productPrice) && (
                      <span className="text-sm text-gray-500 line-through">
                        ${Number(product.offerPrice).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Vendor Info */}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>{product.userBy?.companyAddress || 'Location not specified'}</span>
                  </div>

                  {/* Category Badge */}
                  <Badge variant="secondary" className="text-xs">
                    {product.category?.name || 
                     product.category?.categoryName || 
                     product.categoryName || 
                     'Uncategorized'}
                  </Badge>

                  {/* Stock Info */}
                  <div className="text-xs text-gray-500">
                    Stock: {product.product_productPrice?.[0]?.stock || 0} units
                  </div>
                </div>

                {/* Selection Button */}
                <Button
                  type="button"
                  size="sm"
                  className={`w-full mt-3 ${
                    selectedProduct?.id === product.id
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductSelect(product);
                  }}
                >
                  {selectedProduct?.id === product.id ? t("selected") : t("select")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {products && products.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{t("no_products_found")}</p>
          <p className="text-sm text-gray-400">{t("try_different_search_terms")}</p>
        </div>
      )}

      {/* Empty State - Only show when no products are loaded and no search has been performed */}
      {!hasSearched && !products.length && !isLoading && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{t("no_dropshipable_products_available")}</p>
          <p className="text-sm text-gray-400">{t("try_searching_for_specific_products")}</p>
        </div>
      )}
    </div>
  );
};

export default ProductSearchSelector;
