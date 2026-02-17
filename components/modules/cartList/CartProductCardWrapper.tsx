"use client";
import React from "react";
import ProductCard from "./ProductCard";
import { useProductById } from "@/apis/queries/product.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useAuth } from "@/context/AuthContext";
import { CartItem } from "@/utils/types/cart.types";

type CartProductCardWrapperProps = {
  item: CartItem;
  onRemove: (cartId: number) => void;
  onWishlist: (productId: number) => void;
  haveAccessToken: boolean;
  relatedCart?: any;
};

const CartProductCardWrapper: React.FC<CartProductCardWrapperProps> = ({
  item,
  onRemove,
  onWishlist,
  haveAccessToken,
  relatedCart,
}) => {
  const { user } = useAuth();
  const currentAccount = useCurrentAccount();
  const currentTradeRole = currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;

  // Fetch product data to get consumerType and category information
  const productQuery = useProductById(
    { productId: item.productId.toString() },
    haveAccessToken && item.productId > 0
  );

  // Get categoryId from product data
  const categoryId = React.useMemo(() => {
    if (productQuery?.data?.data) {
      return productQuery.data.data.categoryId ?? productQuery.data.data.category?.id;
    }
    return undefined;
  }, [productQuery?.data?.data]);

  // Fetch category data separately to get connections (like trending page does)
  // This ensures we get fresh category connection data that reflects current vendor business categories
  const productCategoryQuery = useCategory(
    categoryId?.toString(),
    !!(currentTradeRole && currentTradeRole !== "BUYER" && categoryId)
  );

  // Get consumerType and category info from product data
  const productInfo = React.useMemo(() => {
    if (productQuery?.data?.data) {
      const activePriceEntry = productQuery.data.data.product_productPrice?.find(
        (pp: any) => pp?.status === "ACTIVE"
      ) || productQuery.data.data.product_productPrice?.[0];
      
      // Use category connections from the separate category query (more reliable and fresh)
      const categoryConnections = productCategoryQuery?.data?.data?.category_categoryIdDetail || 
                                  productQuery.data.data.category?.category_categoryIdDetail || [];
      
      return {
        consumerType: activePriceEntry?.consumerType,
        categoryId: categoryId,
        categoryLocation: productQuery.data.data.categoryLocation ?? 
                         productQuery.data.data.category?.categoryLocation ??
                         productCategoryQuery?.data?.data?.categoryLocation,
        categoryConnections: categoryConnections,
      };
    }
    return {
      consumerType: undefined,
      categoryId: undefined,
      categoryLocation: undefined,
      categoryConnections: [],
    };
  }, [productQuery?.data?.data, productCategoryQuery?.data?.data, categoryId]);

  return (
    <ProductCard
      cartId={item.id}
      productId={item.productId}
      productPriceId={item.productPriceId}
      productName={item.productPriceDetails?.productPrice_product?.productName}
      offerPrice={item.productPriceDetails?.offerPrice}
      productQuantity={item.quantity}
      productVariant={item.object}
      productImages={item.productPriceDetails?.productPrice_product?.productImages}
      consumerDiscount={item.productPriceDetails?.consumerDiscount || 0}
      consumerDiscountType={item.productPriceDetails?.consumerDiscountType}
      vendorDiscount={item.productPriceDetails?.vendorDiscount || 0}
      vendorDiscountType={item.productPriceDetails?.vendorDiscountType}
      consumerType={productInfo.consumerType}
      categoryId={productInfo.categoryId}
      categoryLocation={productInfo.categoryLocation}
      categoryConnections={productInfo.categoryConnections}
      onRemove={onRemove}
      onWishlist={onWishlist}
      haveAccessToken={haveAccessToken}
      minQuantity={item?.productPriceDetails?.minQuantityPerCustomer}
      maxQuantity={item?.productPriceDetails?.maxQuantityPerCustomer}
      relatedCart={relatedCart}
    />
  );
};

export default CartProductCardWrapper;

