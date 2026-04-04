import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { FaCircleCheck } from "react-icons/fa6";
import ShoppingIcon from "@/components/icons/ShoppingIcon";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import { useTranslations } from "next-intl";
import { useDeleteCartItem, useUpdateCartWithLogin } from "@/apis/queries/cart.queries";
import { useUpdateFactoriesCartWithLogin, useDeleteFactoriesCartItem } from "@/apis/queries/rfq.queries";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IoCloseSharp } from "react-icons/io5";
import { useClickOutside } from "use-events";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { useCategory } from "@/apis/queries/category.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";

type RfqProductCardProps = {
  id: number;
  productType: "F" | "P";
  productName: string;
  productNote: string;
  productStatus: string;
  productImages: {
    image: string;
  }[];
  productVariants?: any[];
  productQuantity: number;
  productVariant?: any;
  customizeProductId?: number;
  onAdd?: () => void;
  onWishlist: () => void;
  isCreatedByMe: boolean;
  cartId?: number;
  isAddedToFactoryCart?: boolean;
  inWishlist?: boolean;
  haveAccessToken: boolean;
  productPrices?: any[];
  categoryId?: number;
  categoryLocation?: string;
  consumerType?: "CONSUMER" | "VENDORS" | "EVERYONE";
};

const FactoriesProductCard: React.FC<RfqProductCardProps> = ({
  id,
  productType,
  productName,
  productNote,
  productStatus,
  productImages,
  productVariants = [],
  productQuantity,
  productVariant,
  customizeProductId,
  onAdd,
  onWishlist,
  isCreatedByMe,
  cartId,
  isAddedToFactoryCart,
  inWishlist,
  haveAccessToken,
  productPrices,
  categoryId,
  categoryLocation,
  consumerType,
}) => {
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();
  const currentAccount = useCurrentAccount();
  const vendorBusinessCategoryIds = useVendorBusinessCategories();

  // Get the current account's trade role (for multi-account system)
  const currentTradeRole = currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  
  // Fetch product category data to get connections (only if vendor and categoryId exists)
  const productCategoryQuery = useCategory(
    categoryId?.toString(),
    !!(currentTradeRole && currentTradeRole !== "BUYER" && categoryId)
  );
  
  const categoryConnections = productCategoryQuery?.data?.data?.category_categoryIdDetail || [];
  const [productVariantTypes, setProductVariantTypes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [selectedProductVariant, setSelectedProductVariant] = useState<any>(productVariant);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const handleConfirmDialog = () => setIsConfirmDialogOpen(!isConfirmDialogOpen);
  const confirmDialogRef = useRef(null);
  const [isClickedOutsideConfirmDialog] = useClickOutside([confirmDialogRef], (event) => { onCancelRemove() });

  useEffect(() => {
    setQuantity(productQuantity || 0);
  }, [productQuantity]);

  useEffect(() => {
    if (productVariants.length > 0) {
      const variantTypes: string[] = [...new Set(productVariants.map((variant: any) => variant.type))];
      setProductVariantTypes(variantTypes);

      if (!productVariant) {
        const selectedVariant: any[] = [];
        variantTypes.forEach((variantType, index) => {
          selectedVariant.push(productVariants.find((variant: any) => variant.type == variantType));
        });
        setSelectedProductVariant(selectedVariant);
      } else {
        setSelectedProductVariant(
          !Array.isArray(productVariant) ? [productVariant] : productVariant
        );
      }
    }
  }, [productVariants, productVariant]);

  useEffect(() => {
    setSelectedProductVariant(productVariant);
  }, [productVariant]);

  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateFactoriesCartWithLogin = useUpdateFactoriesCartWithLogin();
  const deleteCartItem = useDeleteCartItem();
  const deleteFactoriesCartItem = useDeleteFactoriesCartItem();

  const handleAddToCart = async (
    quantity: number,
    action: "add" | "remove",
    variant?: any
  ) => {
    const minQuantity = productPrices?.length ? productPrices[0]?.minQuantityPerCustomer : null;
    if (action == "add" && minQuantity && minQuantity > quantity) {
      toast({
        description: t("min_quantity_must_be_n", { n: minQuantity }),
        variant: "danger",
      });
      return;
    }

    const maxQuantity = productPrices?.length ? productPrices[0]?.maxQuantityPerCustomer : null;
    if (maxQuantity && maxQuantity < quantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      return;
    }

    // Show confirmation dialog if removing (quantity 0) and item is in cart
    if (action == "remove" && quantity === 0) {
      setIsConfirmDialogOpen(true);
      return;
    }

    // Also check for minimum quantity violation
    if (action == "remove" && minQuantity && minQuantity > quantity) {
      setIsConfirmDialogOpen(true);
      return;
    }

    if (haveAccessToken) {
      // Use factories cart mutation if item is in factories cart
      if (isAddedToFactoryCart && customizeProductId) {
        const response = await updateFactoriesCartWithLogin.mutateAsync({
          productId: id,
          quantity,
          customizeProductId
        });

        if (response.status) {
          if (action === "add" && quantity === 0) {
            setQuantity(1);
          } else {
            setQuantity(quantity);
          }
          toast({
            title: action == "add" ? t("item_added_to_cart") : t("item_removed_from_cart"),
            description: t("check_your_cart_for_more_details"),
            variant: "success",
          });
        } else {
          toast({
            title: t("something_went_wrong"),
            description: response.message,
            variant: "danger",
          });
        }
        return;
      }

      // Fallback to regular cart if no customizeProductId
      if (!productPrices?.length || !productPrices?.[0]?.id) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartWithLogin.mutateAsync({
        productPriceId: productPrices?.[0]?.id,
        quantity,
        productVariant: variant || selectedProductVariant
      });

      if (response.status) {
        if (action === "add" && quantity === 0) {
          setQuantity(1);
        } else {
          setQuantity(quantity);
        }
        toast({
          title: action == "add" ? t("item_added_to_cart") : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
      } else {
        toast({
          title: t("something_went_wrong"),
          description: response.message,
          variant: "danger",
        });
      }
    }
  };

  const handleQuantity = (quantity: number, action: "add" | "remove") => {
    const minQuantity = productPrices?.length ? productPrices[0]?.minQuantityPerCustomer : null;
    const maxQuantity = productPrices?.length ? productPrices[0]?.maxQuantityPerCustomer : null;

    if (maxQuantity && maxQuantity < quantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      setQuantity(productQuantity || maxQuantity);
      return;
    }

    setQuantity(quantity);
    // If item is already in cart, update immediately
    if (cartId || isAddedToFactoryCart) {
      handleAddToCart(quantity, action);
    }
  };

  const handleQuantityChange = () => {
    if (quantity == 0 && productQuantity != 0) {
      toast({
        description: t("quantity_can_not_be_0"),
        variant: "danger",
      });
      handleQuantity(quantity, "remove");
      return;
    }

    const minQuantity = productPrices?.length ? productPrices[0]?.minQuantityPerCustomer : null;
    if (minQuantity && minQuantity > quantity) {
      toast({
        description: t("min_quantity_must_be_n", { n: minQuantity }),
        variant: "danger",
      });
      handleQuantity(quantity, quantity > productQuantity ? "add" : "remove");
      return;
    }

    const maxQuantity = productPrices?.length ? productPrices[0]?.maxQuantityPerCustomer : null;
    if (maxQuantity && maxQuantity < quantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      setQuantity(productQuantity || maxQuantity);
      return;
    }

    const action = quantity > productQuantity ? "add" : "remove";
    if (quantity != productQuantity) handleQuantity(quantity, action);
  };

  const handleRemoveItemFromCart = async (cartId: number) => {
    // Use factories cart delete if item is in factories cart
    if (isAddedToFactoryCart && cartId) {
      const response = await deleteFactoriesCartItem.mutateAsync({ factoriesCartId: cartId });
      if (response.status) {
        toast({
          title: t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
      } else {
        toast({
          title: t("item_not_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "danger",
        });
      }
    } else {
      // Use regular cart delete
      const response = await deleteCartItem.mutateAsync({ cartId });
      if (response.status) {
        toast({
          title: t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
      } else {
        toast({
          title: t("item_not_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "danger",
        });
      }
    }
  };

  const onConfirmRemove = () => {
    if (cartId) handleRemoveItemFromCart(cartId);
    setIsConfirmDialogOpen(false);
  };

  const onCancelRemove = () => {
    setQuantity(productQuantity);
    setIsConfirmDialogOpen(false);
  };

  // Helper function to get the applicable discount for the current user
  const getApplicableDiscount = () => {
    // Normalize consumerType to uppercase and handle both "VENDOR" and "VENDORS"
    const rawConsumerType = consumerType || productPrices?.[0]?.consumerType || "CONSUMER";
    const productConsumerType = typeof rawConsumerType === "string" 
      ? rawConsumerType.toUpperCase().trim() 
      : "CONSUMER";
    
    // Check if it's a vendor type (VENDOR or VENDORS)
    const isVendorType = productConsumerType === "VENDOR" || productConsumerType === "VENDORS";
    const isConsumerType = productConsumerType === "CONSUMER";
    const isEveryoneType = productConsumerType === "EVERYONE";
    
    // Check if vendor business category matches product category
    const isCategoryMatch = checkCategoryConnection(
      vendorBusinessCategoryIds,
      categoryId || 0,
      categoryLocation,
      categoryConnections
    );
    
    let discount = 0;
    let discountType: string | undefined;
    
    // Apply discount logic based on your table
    if (currentTradeRole && currentTradeRole !== "BUYER") {
      // VENDOR (V) or EVERYONE (E) as vendor
      if (isCategoryMatch) {
        // Same relation - Vendor gets vendor discount
        if (productPrices?.[0]?.vendorDiscount && productPrices?.[0]?.vendorDiscount > 0) {
          discount = productPrices?.[0]?.vendorDiscount;
          discountType = productPrices?.[0]?.vendorDiscountType;
        } else {
          // No vendor discount available, no discount
          discount = 0;
        }
      } else {
        // Not same relation
        if (isEveryoneType) {
          // E + Not Same relation → Consumer Discount
          discount = productPrices?.[0]?.consumerDiscount || 0;
          discountType = productPrices?.[0]?.consumerDiscountType;
        } else {
          // VENDORS or CONSUMER + Not Same relation → No Discount
          discount = 0;
        }
      }
    } else {
      // CONSUMER (BUYER) - Gets consumer discount if consumerType is CONSUMER or EVERYONE
      // NO discount if consumerType is VENDOR or VENDORS
      if (isConsumerType || isEveryoneType) {
        discount = productPrices?.[0]?.consumerDiscount || 0;
        discountType = productPrices?.[0]?.consumerDiscountType;
      } else {
        // consumerType is VENDOR/VENDORS - no discount for buyers
        discount = 0;
      }
    }
    
    return { discount, discountType };
  };

  const calculateDiscountedPrice = () => {
    const price = productPrices?.[0]?.offerPrice ? Number(productPrices[0]?.offerPrice) : 0;
    
    const { discount, discountType } = getApplicableDiscount();
    
    // Calculate final price
    if (discount > 0 && discountType) {
      if (discountType === "PERCENTAGE") {
        return Number((price - (price * discount) / 100).toFixed(2));
      } else if (discountType === "FLAT" || discountType === "FIXED") {
        return Number((price - discount).toFixed(2));
      }
    }
    
    return price;
  };

  return (
    <>
      <div className="group relative bg-card rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg border border-border hover:shadow-xl hover:border-border transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Product Image Container */}
        <Link href={`/factories/${id}`} className="block w-full">
          {/* Discount Badge - Only show if user is eligible for discount */}
          {(() => {
            const { discount, discountType } = getApplicableDiscount();
            return discount > 0 && discountType ? (
              <div className="absolute right-3 top-3 z-20 bg-gradient-to-r from-warning to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                {discountType === "PERCENTAGE" 
                  ? `${discount}%` 
                  : `${currency.symbol}${discount}`
                }
              </div>
            ) : null;
          })()}

          <div className="relative w-full h-48 lg:h-56 bg-muted overflow-hidden">
            <Image
              src={
                productImages?.[0]?.image && validator.isURL(productImages?.[0]?.image)
                  ? productImages[0].image
                  : PlaceholderImage
              }
              alt={productName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>

        {/* Action Buttons - Hover overlay */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2 z-10">
          {onAdd && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm shadow-lg hover:bg-card hover:scale-110 transition-all duration-200"
              onClick={onAdd}
            >
              <ShoppingIcon />
            </Button>
          )}
          <Link href={`/factories/${id}`}>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm shadow-lg hover:bg-card hover:scale-110 transition-all duration-200"
            >
              <FiEye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm shadow-lg hover:bg-card hover:scale-110 transition-all duration-200"
            onClick={onWishlist}
          >
            {inWishlist ? (
              <FaHeart className="h-4 w-4 text-destructive" />
            ) : (
              <FaRegHeart className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <Link href={`/factories/${id}`}>
            <h3 className="text-sm sm:text-base font-medium text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors" dir={langDir}>
              {productName}
            </h3>
          </Link>

          {/* Product Type Badge */}
          <div className="mb-2">
            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
              {productType === "F" ? t("factory_product") : t("product")}
            </span>
          </div>

          {/* Product Description/Note */}
          {productNote && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2" dir={langDir}>
              {productNote}
            </p>
          )}

          {/* Price */}
          {productPrices?.[0]?.offerPrice ? (
            <div className="mb-3" dir={langDir}>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold text-primary">
                  {currency.symbol}{calculateDiscountedPrice()}
                </span>
                {(() => {
                  const { discount } = getApplicableDiscount();
                  return discount > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      {currency.symbol}{productPrices?.[0]?.offerPrice}
                    </span>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <span className="text-sm font-medium text-muted-foreground">{t("customizable")}</span>
            </div>
          )}

          {/* Variant Selectors */}
          {productVariantTypes.length > 0 && (
            <div className="mb-3 space-y-2">
              {productVariantTypes.map((variantType: string, index: number) => (
                <div key={index} dir={langDir}>
                  <label className="text-xs text-muted-foreground mb-1 block">{variantType}</label>
                  <select
                    className="w-full text-sm border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedProductVariant?.find((variant: any) => variant.type == variantType)?.value}
                    onChange={(e) => {
                      let selectedVariants = [];
                      const value = e.target.value;
                      const selected = productVariants.find(
                        (variant: any) => variant.type == variantType && variant.value == value
                      );

                      if (selectedProductVariant.find((variant: any) => variant.type == selected.type)) {
                        selectedVariants = selectedProductVariant.map((variant: any) => {
                          if (variant.type == selected.type) {
                            return selected;
                          }
                          return variant;
                        });
                      } else {
                        selectedVariants = [
                          ...selectedProductVariant,
                          selected
                        ];
                      }

                      setSelectedProductVariant(selectedVariants);
                      if (cartId) handleAddToCart(quantity, "add", selectedVariants);
                    }}
                  >
                    {productVariants.filter((variant: any) => variant.type == variantType)
                      .map((variant: any, i: number) => (
                        <option key={`${index}${i}`} value={variant.value} dir={langDir}>
                          {variant.value}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Controls */}
          <div className="mt-auto">
            <label className="text-xs text-muted-foreground mb-1 block" translate="no">{t("quantity")}</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-md"
                onClick={() => handleQuantity(quantity - 1, "remove")}
                disabled={quantity === 0 || updateCartWithLogin?.isPending || updateFactoriesCartWithLogin?.isPending || deleteFactoriesCartItem?.isPending}
              >
                -
              </Button>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                onBlur={handleQuantityChange}
                className="w-16 text-center text-sm border border-border rounded-md px-2 py-1"
                dir={langDir}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-md"
                onClick={() => handleQuantity(quantity + 1, "add")}
                disabled={updateCartWithLogin?.isPending || updateFactoriesCartWithLogin?.isPending}
              >
                +
              </Button>
            </div>

            {/* Cart Status */}
            {isAddedToFactoryCart && (
              <div className="flex items-center gap-1 mt-2 text-xs text-success">
                <FaCircleCheck />
                <span>{t("added_to_factory_cart")}</span>
              </div>
            )}

            {/* Add to Factories Cart Button */}
            {onAdd && (
              <Button
                onClick={onAdd}
                className="w-full mt-3 bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-lg transition-colors duration-200 disabled:bg-muted-foreground disabled:cursor-not-allowed"
                disabled={isAddedToFactoryCart || quantity === 0}
              >
                {isAddedToFactoryCart ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaCircleCheck />
                    <span>{t("added_to_cart")}</span>
                  </div>
                ) : quantity === 0 ? (
                  t("select_quantity")
                ) : (
                  t("add_to_factories_cart")
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Remove Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent ref={confirmDialogRef} className="sm:max-w-md">
          <DialogTitle className="flex items-center justify-between">
            <span>{t("confirm_remove")}</span>
            <button onClick={onCancelRemove} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
              <IoCloseSharp className="h-5 w-5" />
            </button>
          </DialogTitle>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{t("are_you_sure_you_want_to_remove_this_item")}</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancelRemove}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={onConfirmRemove}>
              {t("remove")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FactoriesProductCard;
