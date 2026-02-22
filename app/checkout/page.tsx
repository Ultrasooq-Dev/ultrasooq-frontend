"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/modules/checkout/ProductCard";
import {
  useCartListByDevice,
  useCartListByUserId,
  useDeleteCartItem,
  useDeleteServiceFromCart,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import AddressCard from "@/components/modules/checkout/AddressCard";
import AddressForm from "@/components/modules/checkout/AddressForm";
// import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  useAllUserAddress,
  useDeleteAddress,
} from "@/apis/queries/address.queries";
import { useRouter } from "next/navigation";
import { CartItem } from "@/utils/types/cart.types";
import { AddressItem } from "@/utils/types/address.types";
import { useClickOutside } from "use-events";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId } from "@/utils/helper";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMe } from "@/apis/queries/user.queries";
import { OrderDetails } from "@/utils/types/orders.types";
import Image from "next/image";
import { useOrderStore } from "@/lib/orderStore";
import { Input } from "@/components/ui/input";
import GuestAddressCard from "@/components/modules/checkout/GuestAddressCard";
import validator from "validator";
import GuestAddressForm from "@/components/modules/checkout/GuestAddressForm";
import AddIcon from "@/public/images/addbtn.svg";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useAddToWishList } from "@/apis/queries/wishlist.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { usePreOrderCalculation } from "@/apis/queries/orders.queries";
import { useAllProducts } from "@/apis/queries/product.queries";
import { useCategory } from "@/apis/queries/category.queries";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useFindOneRfqQuotesUsersByBuyerID } from "@/apis/queries/rfq.queries";
import { IoCloseSharp } from "react-icons/io5";
import Select from "react-select";
import Shipping from "@/components/modules/checkout/Shipping";
import ServiceCard from "@/components/modules/checkout/ServiceCard";

const CheckoutPage = () => {
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();
  const currentAccount = useCurrentAccount();
  const currentTradeRole = currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  const vendorBusinessCategoryIds = useVendorBusinessCategories() ?? [];
  const router = useRouter();
  const wrapperRef = useRef(null);
  const { toast } = useToast();
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<
    number | undefined
  >();
  // Removed sameAsShipping - billing is now read-only from profile
  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<OrderDetails>();
  const [addressType, setAddressType] = useState<"shipping" | "billing">();
  const [guestShippingAddress, setGuestShippingAddress] = useState<
    | {
        firstName: string;
        lastName: string;
        cc: string;
        phoneNumber: string;
        address: string;
        town: string;
        city: string;
        cityId: string;
        state: string;
        stateId: string;
        country: string;
        countryId: string;
        postCode: string;
      }
    | undefined
  >();
  const [guestBillingAddress, setGuestBillingAddress] = useState<
    | {
        firstName: string;
        lastName: string;
        cc: string;
        phoneNumber: string;
        address: string;
        town: string;
        city: string;
        cityId: string;
        state: string;
        stateId: string;
        country: string;
        countryId: string;
        postCode: string;
      }
    | undefined
  >();
  const [guestEmail, setGuestEmail] = useState("");
  const [itemsTotal, setItemsTotal] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [sellerIds, setSellerIds] = useState<number[]>([]);
  const [shippingInfo, setShippingInfo] = useState<any[]>([]);
  const [shippingErrors, setShippingErrors] = useState<any[]>([]);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  const [rfqQuoteData, setRfqQuoteData] = useState<any>(null);
  const [isFromRfq, setIsFromRfq] = useState<boolean>(false);

  const [selectedCartId, setSelectedCartId] = useState<number>();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState<boolean>(false);
  const handleConfirmDialog = () =>
    setIsConfirmDialogOpen(!isConfirmDialogOpen);
  const confirmDialogRef = useRef(null);
  const [isClickedOutsideConfirmDialog] = useClickOutside(
    [confirmDialogRef],
    (event) => {
      onCancelRemove();
    },
  );

  const [selectedSellerId, setSelectedSellerId] = useState<number>();
  const [selectedShippingType, setSelectedShippingType] = useState<string>();
  const [fromCityId, setFromCityId] = useState<number>();
  const [toCityId, setToCityId] = useState<number>();
  const [isShippingModalOpen, setIsShippingModalOpen] =
    useState<boolean>(false);
  const handleShippingModal = () =>
    setIsShippingModalOpen(!isShippingModalOpen);
  const shippingModalRef = useRef(null);

  const deviceId = getOrCreateDeviceId() || "";
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);

  const orderStore = useOrderStore();
  const preOrderCalculation = usePreOrderCalculation();

  // Fetch RFQ quote details if coming from RFQ
  const rfqQuoteDetailsQuery = useFindOneRfqQuotesUsersByBuyerID(
    {
      rfqQuotesId: rfqQuoteData?.rfqQuotesId,
    },
    isFromRfq && !!rfqQuoteData?.rfqQuotesId,
  );

  // Check if coming from RFQ and load RFQ data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const fromRfq = params.get("fromRfq") === "true";
      setIsFromRfq(fromRfq);
      
      if (fromRfq) {
        const storedRfqData = sessionStorage.getItem("rfqQuoteData");
        if (storedRfqData) {
          try {
            const parsed = JSON.parse(storedRfqData);
            setRfqQuoteData(parsed);
            // Set total from RFQ quote
            setTotalAmount(parsed.totalPrice || 0);
            setSubTotal(parsed.totalPrice || 0);
            setItemsTotal(parsed.totalPrice || 0);
          } catch (e) {
            console.error("Error parsing RFQ data:", e);
          }
        }
      }
    }
  }, []);

  // Get RFQ quote details with products
  const rfqQuoteDetails = rfqQuoteDetailsQuery.data?.data;

  // Recalculate total from approved product prices when RFQ quote details are loaded
  useEffect(() => {
    if (isFromRfq && rfqQuoteData) {
      // Calculate total from original RFQ products
      const originalProductsTotal = (rfqQuoteData.quoteProducts || []).reduce((total: number, quoteProduct: any) => {
        const price = parseFloat(quoteProduct.offerPrice || "0");
        const quantity = quoteProduct.quantity || 1;
        return total + price * quantity;
      }, 0);

      // NEW: Calculate total from selected suggested products
      const suggestedProductsTotal = (rfqQuoteData.suggestedProducts || []).reduce((total: number, suggestedProduct: any) => {
        const price = parseFloat(suggestedProduct.offerPrice || "0");
        const quantity = suggestedProduct.quantity || 1;
        return total + price * quantity;
      }, 0);

      // Combine totals
      const calculatedTotal = originalProductsTotal + suggestedProductsTotal;

      // Update totals with calculated value (use rfqQuoteData.totalPrice if available, otherwise calculate)
      const finalTotal = rfqQuoteData.totalPrice || calculatedTotal;
      setTotalAmount(finalTotal);
      setSubTotal(finalTotal);
      setItemsTotal(finalTotal);
    }
  }, [isFromRfq, rfqQuoteData]);

  const [isClickedOutside] = useClickOutside([wrapperRef], (event) => {});

  const me = useMe(haveAccessToken);
  const cartListByDeviceQuery = useCartListByDevice(
    {
      page: 1,
      limit: 100,
      deviceId,
    },
    !haveAccessToken,
  );
  const cartListByUser = useCartListByUserId(
    {
      page: 1,
      limit: 100,
    },
    haveAccessToken,
  );
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const deleteCartItem = useDeleteCartItem();
  const deleteServiceFromCart = useDeleteServiceFromCart();
  const addToWishlist = useAddToWishList();
  const allUserAddressQuery = useAllUserAddress(
    {
      page: 1,
      limit: 10,
    },
    haveAccessToken,
  );
  const delteAddress = useDeleteAddress();

  const handleToggleAddModal = () => setIsAddModalOpen(!isAddModalOpen);

  const memoizedCartList = useMemo(() => {
    if (cartListByUser.data?.data) {
      return cartListByUser.data?.data || [];
    } else if (cartListByDeviceQuery.data?.data) {
      return cartListByDeviceQuery.data?.data || [];
    }
    return [];
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

  // Get unique product IDs from cart for fetching fresh category data
  const uniqueProductIds = useMemo(() => {
    const productIds = new Set<number>();
    memoizedCartList.forEach((item: CartItem) => {
      if (item.cartType === "DEFAULT" && item.productId) {
        productIds.add(item.productId);
      }
    });
    return Array.from(productIds);
  }, [memoizedCartList]);

  // Fetch all products that are in the cart to get fresh category data
  const allProductsQuery = useAllProducts(
    {
      page: 1,
      limit: 1000, // Fetch enough to cover all cart items
    },
    haveAccessToken && uniqueProductIds.length > 0
  );

  // Get unique category IDs from products in cart
  const uniqueCategoryIds = useMemo(() => {
    const categoryIds = new Set<number>();
    if (allProductsQuery?.data?.data) {
      allProductsQuery.data.data.forEach((product: any) => {
        if (uniqueProductIds.includes(product.id)) {
          const categoryId = product?.categoryId ?? product?.category?.id;
          if (categoryId) {
            categoryIds.add(categoryId);
          }
        }
      });
    }
    return Array.from(categoryIds);
  }, [allProductsQuery?.data?.data, uniqueProductIds]);

  // Fetch category data for the first category (if vendor)
  const firstCategoryId = uniqueCategoryIds.length > 0 ? uniqueCategoryIds[0] : undefined;
  const firstCategoryQuery = useCategory(
    firstCategoryId?.toString(),
    !!(currentTradeRole && currentTradeRole !== "BUYER" && firstCategoryId)
  );

  // Create a map of productId -> pricing metadata with fresh category connections
  const productPricingInfoMap = useMemo(() => {
    const map = new Map<
      number,
      {
        consumerType?: string;
        vendorDiscount?: number;
        vendorDiscountType?: string;
        consumerDiscount?: number;
        consumerDiscountType?: string;
        categoryId?: number;
        categoryLocation?: string;
        categoryConnections?: any[];
      }
    >();

    if (allProductsQuery?.data?.data) {
      allProductsQuery.data.data.forEach((product: any) => {
        if (uniqueProductIds.includes(product.id)) {
          const activePriceEntry =
            product?.product_productPrice?.find((pp: any) => pp?.status === "ACTIVE") ||
            product?.product_productPrice?.[0];

          const categoryId = product?.categoryId ?? product?.category?.id;
          
          // Get fresh category connections - prioritize from category query if it matches
          let freshCategoryConnections: any[] = [];
          if (categoryId === firstCategoryId && firstCategoryQuery?.data?.data?.category_categoryIdDetail) {
            freshCategoryConnections = firstCategoryQuery.data.data.category_categoryIdDetail;
          } else if (product?.category?.category_categoryIdDetail) {
            freshCategoryConnections = product.category.category_categoryIdDetail;
          }

          map.set(product.id, {
            consumerType: activePriceEntry?.consumerType,
            vendorDiscount: activePriceEntry?.vendorDiscount,
            vendorDiscountType: activePriceEntry?.vendorDiscountType,
            consumerDiscount: activePriceEntry?.consumerDiscount,
            consumerDiscountType: activePriceEntry?.consumerDiscountType,
            categoryId: categoryId,
            categoryLocation: product?.categoryLocation ?? product?.category?.categoryLocation,
            categoryConnections: freshCategoryConnections,
          });
        }
      });
    }

    return map;
  }, [allProductsQuery?.data?.data, uniqueProductIds, firstCategoryId, firstCategoryQuery?.data?.data]);

  const calculateDiscountedPrice = (
    offerPrice: string | number,
    discount: number,
    discountType?: string,
  ) => {
    const price = offerPrice ? Number(offerPrice) : 0;
    if (!price) return 0;

    if (discount > 0 && discountType) {
      const normalizedType = discountType.toString().toUpperCase().trim();
      if (normalizedType === "PERCENTAGE") {
        return Number((price - (price * discount) / 100).toFixed(2));
      }
      if (
        normalizedType === "FIXED" ||
        normalizedType === "FLAT" ||
        normalizedType === "AMOUNT"
      ) {
        return Number((price - discount).toFixed(2));
      }
    }

    return price;
  };

  const getApplicableDiscountedPrice = (
    cartItem: CartItem,
  ) => {
    const productPriceDetails: any = cartItem.productPriceDetails || {};
    const productInfo = productPricingInfoMap.get(cartItem.productId);

    const rawConsumerType =
      productInfo?.consumerType || productPriceDetails?.consumerType || "";
    const consumerType =
      typeof rawConsumerType === "string"
        ? rawConsumerType.toUpperCase().trim()
        : "";

    const isVendorType = consumerType === "VENDOR" || consumerType === "VENDORS";
    const isConsumerType = consumerType === "CONSUMER";
    const isEveryoneType = consumerType === "EVERYONE";

    const categoryId = Number(productInfo?.categoryId || 0);
    const categoryLocation = productInfo?.categoryLocation;
    const categoryConnections = productInfo?.categoryConnections || [];

    const isCategoryMatch = checkCategoryConnection(
      vendorBusinessCategoryIds,
      categoryId,
      categoryLocation,
      categoryConnections,
    );

    const vendorDiscountValue = Number(
      productInfo?.vendorDiscount ?? productPriceDetails?.vendorDiscount ?? 0
    );
    const vendorDiscountType = productInfo?.vendorDiscountType || productPriceDetails?.vendorDiscountType;
    const normalizedVendorDiscountType = vendorDiscountType
      ? vendorDiscountType.toString().toUpperCase().trim()
      : undefined;

    const consumerDiscountValue = Number(
      productInfo?.consumerDiscount ?? productPriceDetails?.consumerDiscount ?? 0
    );
    const consumerDiscountType = productInfo?.consumerDiscountType || productPriceDetails?.consumerDiscountType;
    const normalizedConsumerDiscountType = consumerDiscountType
      ? consumerDiscountType.toString().toUpperCase().trim()
      : undefined;

    let discount = 0;
    let discountType: string | undefined;

    if (currentTradeRole && currentTradeRole !== "BUYER") {
      // VENDOR user
      if (isVendorType || isEveryoneType) {
        // consumerType is VENDOR/VENDORS or EVERYONE - vendor can get vendor discount
        // BUT category match is REQUIRED for vendor discounts
        if (isCategoryMatch) {
          // Same relation - Vendor gets vendor discount if available
          if (vendorDiscountValue > 0 && normalizedVendorDiscountType) {
            discount = vendorDiscountValue;
            discountType = normalizedVendorDiscountType;
          } else {
            // No vendor discount available, no discount
            discount = 0;
          }
        } else {
          // Not same relation - No vendor discount
          // If consumerType is EVERYONE, fallback to consumer discount
          if (isEveryoneType) {
            if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
              discount = consumerDiscountValue;
              discountType = normalizedConsumerDiscountType;
            } else {
              discount = 0;
            }
          } else {
            // consumerType is VENDOR/VENDORS but no category match - no discount
            discount = 0;
          }
        }
      } else {
        // consumerType is CONSUMER - vendors get no discount
        discount = 0;
      }
    } else {
      // CONSUMER (BUYER) - Gets consumer discount if consumerType is CONSUMER or EVERYONE
      if (isConsumerType || isEveryoneType) {
        if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
          discount = consumerDiscountValue;
          discountType = normalizedConsumerDiscountType;
        }
      } else {
        // consumerType is VENDOR/VENDORS - no discount for buyers
        discount = 0;
      }
    }

    return calculateDiscountedPrice(
      productPriceDetails?.offerPrice ?? 0,
      discount,
      discountType,
    );
  };

  const calculateTotalAmount = () => {
    if (cartListByUser.data?.data?.length) {
      setItemsTotal(
        cartListByUser.data?.data?.reduce(
          (
            acc: number,
            curr: {
              cartType: "DEFAULT" | "SERVICE";
              productPriceDetails: {
                offerPrice: string;
                consumerDiscount?: number;
                consumerDiscountType?: string;
                vendorDiscount?: number;
                vendorDiscountType?: string;
              };
              quantity: number;
              productId?: number;
              serviceId?: number;
              cartServiceFeatures: any[];
              service: {
                eachCustomerTime: number;
              }
            },
          ) => {
            const productId = curr.productId;
            const isInvalidProduct =
              typeof productId === "number" && invalidProducts.includes(productId);
            const isNotAvailable =
              typeof productId === "number" && notAvailableProducts.includes(productId);

            if (curr.cartType == "DEFAULT" && !isInvalidProduct && !isNotAvailable) {
              const discountedPrice = getApplicableDiscountedPrice(
                curr as unknown as CartItem,
              );
              return Number(
                (acc + discountedPrice * curr.quantity).toFixed(2),
              );
            }

            if (!curr.cartServiceFeatures?.length) return acc;

            let amount = 0;
            for (const feature of curr.cartServiceFeatures) {
              if (feature.serviceFeature?.serviceCostType == "FLAT") {
                amount += Number(feature.serviceFeature?.serviceCost || '') * (feature.quantity || 1);
              } else {
                amount += Number(feature?.serviceFeature?.serviceCost || '') * (feature.quantity || 1) * curr.service.eachCustomerTime;
              }
            }

            return Number((acc + amount).toFixed(2));
          },
          0,
        ),
      );
    } else if (cartListByDeviceQuery.data?.data?.length) {
      setItemsTotal(
        cartListByDeviceQuery.data?.data?.reduce(
          (
            acc: number,
            curr: {
              cartType: "DEFAULT" | "SERVICE";
              productPriceDetails: {
                offerPrice: string;
              };
              quantity: number;
              productId?: number;
              serviceId?: number;
              cartServiceFeatures: any[];
              service: {
                eachCustomerTime: number
              }
            },
          ) => {
            const productId = curr.productId;
            const isInvalidProduct =
              typeof productId === "number" && invalidProducts.includes(productId);
            const isNotAvailable =
              typeof productId === "number" && notAvailableProducts.includes(productId);

            if (curr.cartType == "DEFAULT" && !isInvalidProduct && !isNotAvailable) {
              const discountedPrice = calculateDiscountedPrice(
                curr.productPriceDetails?.offerPrice ?? 0,
                Number((curr.productPriceDetails as any)?.consumerDiscount || 0),
                (curr.productPriceDetails as any)?.consumerDiscountType,
              );

              return Number(
                (acc + discountedPrice * curr.quantity).toFixed(2),
              );
            }

            if (!curr.cartServiceFeatures?.length) return acc;

            let amount = 0;
            for (const feature of curr.cartServiceFeatures) {
              if (feature.serviceFeature?.serviceCostType == "FLAT") {
                amount += Number(feature.serviceFeature?.serviceCost || '') * (feature.quantity || 1);
              } else {
                amount += Number(feature?.serviceFeature?.serviceCost || '') * (feature.quantity || 1) * curr.service.eachCustomerTime;
              }
            }
  
            return Number((acc + amount).toFixed(2));
          },
          0,
        ),
      );
    }
  };

  const memoziedAddressList = useMemo(() => {
    return allUserAddressQuery.data?.data || [];
  }, [allUserAddressQuery.data?.data]);

  const shippingOptions = () => {
    return [
      { value: "PICKUP", label: "Consumer Pickup" },
      { value: "SELLERDROP", label: "Delivery By Seller" },
      { value: "THIRDPARTY", label: "Third Party" },
    ];
  };

  const handleAddToCart = async (
    quantity: number,
    actionType: "add" | "remove",
    productPriceId: number,
    productVariant?: any,
  ) => {
    if (haveAccessToken) {
      const response = await updateCartWithLogin.mutateAsync({
        productPriceId,
        quantity,
        productVariant,
      });

      if (response.status) {
        toast({
          title:
            actionType == "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
      }
    } else {
      const response = await updateCartByDevice.mutateAsync({
        productPriceId,
        quantity,
        deviceId,
      });
      if (response.status) {
        toast({
          title:
            actionType == "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
      }
    }
  };

  const handleRemoveItemFromCart = async (cartId: number) => {
    const response = await deleteCartItem.mutateAsync({ cartId });
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    }
  };

  const onConfirmRemove = () => {
    if (selectedCartId) handleRemoveItemFromCart(selectedCartId);
    setIsConfirmDialogOpen(false);
    setSelectedCartId(undefined);
  };

  const onCancelRemove = () => {
    setIsConfirmDialogOpen(false);
    setSelectedCartId(undefined);
  };

  const handleRemoveServiceFromCart = async (cartId: number, serviceFeatureId: number) => {
    const cartItem = memoizedCartList.find((item: any) => item.id == cartId);
    const payload: any = { cartId };
    if (cartItem?.cartServiceFeatures?.length > 1) {
      payload.serviceFeatureId = serviceFeatureId;
    }
    const response = await deleteServiceFromCart.mutateAsync(payload);
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: response.message || t("item_not_removed_from_cart"),
        description: response.message || t("check_your_cart_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleDeleteAddress = async (userAddressId: number) => {
    const response = await delteAddress.mutateAsync({ userAddressId });
    if (response.status) {
      toast({
        title: t("address_removed"),
        description: t("check_your_address_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: t("item_not_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleAddToWishlist = async (productId: number) => {
    const response = await addToWishlist.mutateAsync({ productId });
    if (response.status) {
      toast({
        title: t("item_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: response.message || t("item_not_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleOrderDetails = (
    item: AddressItem,
    addresszType: "shipping" | "billing",
  ) => {
    if (addresszType === "shipping") {
      setSelectedOrderDetails((prevState) => ({
        ...prevState,
        firstName: item.firstName || me.data?.data?.firstName,
        lastName: item.lastName || me.data?.data?.lastName,
        email: me.data?.data?.email,
        cc: item.cc,
        phone: item.phoneNumber,
        shippingAddress: item.address,
        // shippingTown: item.town,
        shippingCity: item.cityDetail?.name,
        shippingProvince: item.stateDetail?.name,
        shippingCountry: item.countryDetail?.name,
        shippingPostCode: item.postCode,
      }));
    }
    // Billing is read-only from profile, so we don't update it here
  };

  // State for selected addresses
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<
    string | null
  >(null);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<
    string | null
  >(null);

  //  Set default selected address when addresses are loaded
  useEffect(() => {
    if (memoziedAddressList.length > 0) {
      setSelectedShippingAddressId(memoziedAddressList[0].id.toString());
      // Only set shipping address, billing comes from profile
      handleOrderDetails(memoziedAddressList[0], "shipping");
    }
  }, [memoziedAddressList]);

  // Initialize billing address from profile information (read-only)
  useEffect(() => {
    if (me.data?.data) {
      const profileData = me.data.data;
      const primaryPhone = profileData.userPhone?.[0] || {
        cc: profileData.cc || "",
        phoneNumber: profileData.phoneNumber || "",
      };
      
      // Use first address for billing address fields, or empty if no addresses
      const billingAddressData = memoziedAddressList.length > 0 
        ? memoziedAddressList[0] 
        : null;

      setSelectedOrderDetails((prevState) => ({
        ...prevState,
        // Billing name and contact from profile
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
        cc: primaryPhone.cc || "",
        phone: primaryPhone.phoneNumber || "",
        // Billing address from first address or empty
        billingAddress: billingAddressData?.address || "",
        billingCity: billingAddressData?.cityDetail?.name || "",
        billingProvince: billingAddressData?.stateDetail?.name || "",
        billingCountry: billingAddressData?.countryDetail?.name || "",
        billingPostCode: billingAddressData?.postCode || "",
      }));
    }
  }, [me.data, memoziedAddressList]);

  const [invalidProducts, setInvalidProducts] = useState<number[]>([]);
  const [notAvailableProducts, setNotAvailableProducts] = useState<number[]>(
    [],
  );

  const calculateFees = async () => {
    const response: any = await preOrderCalculation.mutateAsync({
      cartIds: memoizedCartList.filter((item: any) => item.productId)?.map((item: any) => item.id),
      serviceCartIds: memoizedCartList.filter((item: any) => item.serviceId)?.map((item: any) => item.id),
      userAddressId: Number(selectedShippingAddressId),
    });

    const invalidProductIds = response?.invalidProducts?.map((productId: number) => productId) || [];
    const notAvailableProductIds = response?.productCannotBuy?.map((item: any) => item.productId) || [];

    setInvalidProducts(invalidProductIds);
    setNotAvailableProducts(notAvailableProductIds);

    let chargedFee = 0;
    if (response?.data?.length) {
      response.data.forEach((item: any) => {
        if (item.orderProductType != 'SERVICE') {
          chargedFee += Number(item?.breakdown?.customer?.chargedFee);
        }
      });
    }
    setFee(chargedFee);

    calculateTotalAmount();

    setSubTotal(response?.totalCustomerPay || 0)
  };

  useEffect(() => {
    if (memoizedCartList.length) {
      let userIds = memoizedCartList.filter((item: any) => item.productPriceDetails)?.map((item: any) => {
        return item.productPriceDetails.adminId;
      }) || [];
      userIds = [...new Set(userIds)];

      setSellerIds(userIds);

      setShippingInfo(
        userIds.map((userId: number) => {
          const info = shippingInfo.find(
            (item: any) => item.sellerId == userId,
          );

          if (info) return info;

          return {
            sellerId: userId,
            shippingType: "PICKUP",
            info: {
              shippingDate: null,
              fromTime: null,
              toTime: null,
              shippingCharge: 0,
              serviceId: null,
            },
          };
        }),
      );

      setShippingErrors(
        userIds.map((userId: number) => {
          const data = shippingErrors.find(
            (item: any) => item.sellerId == userId,
          );

          if (data) return data;

          return {
            sellerId: userId,
            errors: {},
          };
        }),
      );

      if (selectedShippingAddressId) calculateFees();
    }
  }, [
    cartListByUser.data?.data,
    cartListByDeviceQuery?.data?.data,
    allUserAddressQuery?.data?.data,
    selectedBillingAddressId,
    selectedShippingAddressId,
  ]);

  useEffect(() => {
    calculateTotalAmount();
  }, [cartListByUser.data?.data, cartListByDeviceQuery?.data?.data, invalidProducts, notAvailableProducts]);

  useEffect(() => {
    setTotalAmount(itemsTotal + shippingCharge + fee);
  }, [itemsTotal, shippingCharge, fee]);

  useEffect(() => {
    let charge = 0;
    for (const info of shippingInfo) {
      charge += info.info?.shippingCharge || 0;
    }
    setShippingCharge(charge);
  }, [shippingInfo]);

  const validateShippingInfo = (): boolean => {
    let count = 0;
    const errors = shippingErrors;
    let i = 0;
    for (const info of shippingInfo) {
      errors[i].errors = {};

      if (info.shippingType == "SELLERDROP") {
        if (!info?.info?.serviceId) {
          errors[i]["errors"]["serviceId"] = "Shipping service is required";
        }

        count += Object.keys(errors[i]["errors"]).length > 0 ? 1 : 0;
      }

      i++;
    }

    setShippingErrors([...errors]);

    return count == 0;
  };

  const prepareShippingInfo = () => {
    const data: any[] = [];
    let i = 0;
    for (const info of shippingInfo) {
      data[i] = {
        sellerId: info.sellerId,
        orderShippingType: info.shippingType,
        shippingDate: null,
        fromTime: null,
        toTime: null,
        shippingCharge: 0,
        serviceId: null,
      };

      if (info.shippingType == "SELLERDROP") {
        data[i].shippingCharge = info.info.shippingCharge;
        data[i].serviceId = info.info.serviceId;
      }

      i++;
    }

    const serviceSellerIds = memoizedCartList.filter((item: any) => item.serviceId)
      ?.map((item: any) => item.service.sellerId) || [];

    for (const sellerId of serviceSellerIds) {
      if (!data.find((item: any) => item.sellerId == sellerId)) {
        data[i] = {
          sellerId: sellerId,
          orderShippingType: "PICKUP",
          shippingDate: null,
          fromTime: null,
          toTime: null,
          shippingCharge: 0,
          serviceId: null,
        };
      }
    }

    return data;
  };

  const onSaveOrder = () => {
    if (invalidProducts.length > 0 || notAvailableProducts.length > 0) {
      toast({
        description: t("remove_n_items_from_cart", {
          n: invalidProducts.length + notAvailableProducts.length,
        }),
        variant: "danger",
      });
      return;
    }

    if (!validateShippingInfo()) {
      toast({
        title: "Shipping error",
        description: "Shipping data has errors, please check",
        variant: "danger",
      });
      return;
    }

    if (haveAccessToken) {
      if (!selectedOrderDetails?.shippingAddress) {
        toast({
          title: t("please_select_a_shipping_address"),
          variant: "danger",
        });
        return;
      }

      const data = {
        ...selectedOrderDetails,
        cartIds: isFromRfq ? [] : (memoizedCartList?.filter((item: any) => item.productId)?.map((item: CartItem) => item.id) || []),
        serviceCartIds: memoizedCartList?.filter((item: any) => item.serviceId)?.map((item: CartItem) => item.id) || [],
        deliveryCharge: shippingCharge,
        shipping: prepareShippingInfo(),
        // Add RFQ quote data if coming from RFQ
        ...(isFromRfq && rfqQuoteData ? {
          rfqQuotesUserId: rfqQuoteData.rfqQuotesUserId,
          rfqQuotesId: rfqQuoteData.rfqQuotesId,
          sellerId: rfqQuoteData.sellerId,
          buyerId: rfqQuoteData.buyerId,
          rfqQuoteProducts: rfqQuoteData.quoteProducts || [],
          rfqSuggestedProducts: rfqQuoteData.suggestedProducts || [], // NEW: Include selected suggested products
        } : {}),
      };

      // Billing address comes from profile, so we use selectedOrderDetails billing info
      if (!data.billingAddress && selectedOrderDetails?.billingAddress) {
        data.billingAddress = selectedOrderDetails.billingAddress;
        data.billingCity = selectedOrderDetails.billingCity;
        data.billingProvince = selectedOrderDetails.billingProvince;
        data.billingCountry = selectedOrderDetails.billingCountry;
        data.billingPostCode = selectedOrderDetails.billingPostCode;
      }

      if (!data.billingAddress) {
        toast({
          title: t("billing_address_required_from_profile"),
          variant: "danger",
        });
        return;
      }

      const address = memoziedAddressList.find(
        (item: any) => item.id == selectedShippingAddressId,
      );

      orderStore.setOrders({
        ...data,
        ...{
          countryId: address?.countryId,
          stateId: address?.stateId,
          cityId: address?.cityId,
          town: address?.town,
          userAddressId: Number(selectedShippingAddressId),
        },
      });
      orderStore.setTotal(totalAmount);
      router.push("/complete-order");
    } else {
      // if (!guestEmail) {
      //   toast({
      //     title: t("please_enter_email_address"),
      //     variant: "danger",
      //   });
      //   return;
      // }
      // if (!validator.isEmail(guestEmail)) {
      //   toast({
      //     title: t("please_enter_valid_email_address"),
      //     variant: "danger",
      //   });
      //   return;
      // }
      // let guestOrderDetails: any = {
      //   guestUser: {
      //     firstName: "",
      //     lastName: "",
      //     email: "",
      //     cc: "",
      //     phoneNumber: "",
      //   },
      // };
      // if (!guestShippingAddress) {
      //   toast({
      //     title: t("please_add_a_shipping_address"),
      //     variant: "danger",
      //   });
      //   return;
      // }
      // if (guestShippingAddress) {
      //   guestOrderDetails = {
      //     ...guestOrderDetails,
      //     firstName: guestShippingAddress.firstName,
      //     lastName: guestShippingAddress.lastName,
      //     email: "",
      //     cc: guestShippingAddress.cc,
      //     phone: guestShippingAddress.phoneNumber,
      //     shippingAddress: guestShippingAddress.address,
      //     shippingTown: guestShippingAddress.town,
      //     shippingCity: guestShippingAddress.city,
      //     shippingProvince: guestShippingAddress.state,
      //     shippingCountry: guestShippingAddress.country,
      //     shippingPostCode: guestShippingAddress.postCode,
      //   };
      // }
      // if (!guestBillingAddress) {
      //   toast({
      //     title: t("please_add_a_billing_address"),
      //     variant: "danger",
      //   });
      //   return;
      // }
      // if (guestBillingAddress) {
      //   guestOrderDetails = {
      //     ...guestOrderDetails,
      //     billingAddress: guestBillingAddress.address,
      //     billingCity: guestBillingAddress.city,
      //     billingTown: guestBillingAddress.town,
      //     billingProvince: guestBillingAddress.state,
      //     billingCountry: guestBillingAddress.country,
      //     billingPostCode: guestBillingAddress.postCode,
      //   };
      // }
      // const data = {
      //   ...guestOrderDetails,
      //   email: guestEmail,
      //   paymentMethod: "cash",
      //   cartIds: memoizedCartList?.map((item: CartItem) => item.id) || [],
      // };
      // if (
      //   data.firstName !== "" &&
      //   data.lastName !== "" &&
      //   data.cc != "" &&
      //   data.phone !== ""
      // ) {
      //   data.guestUser = {
      //     firstName: data.firstName,
      //     lastName: data.lastName,
      //     email: guestEmail,
      //     cc: data.cc,
      //     phoneNumber: data.phone,
      //   };
      // }
      // orderStore.setOrders(data);
      // orderStore.setTotal(totalAmount);
      // router.push("/complete-order");
    }
  };

  useEffect(() => {
    if (isClickedOutside) {
      setSelectedAddressId(undefined);
    }
  }, [isClickedOutside]);

  useEffect(() => {
    if (accessToken) {
      setHaveAccessToken(true);
    } else {
      setHaveAccessToken(false);
    }
  }, [accessToken]);

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" dir={langDir} translate="no">
            {t("checkout")}
          </h1>
          <p className="text-muted-foreground" dir={langDir} translate="no">
            Review your order and complete your purchase
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted">
                <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
                  {t("order_summary")}
                </h2>
              </div>

              <div className="p-6">
                {/* RFQ Products Display - Prioritize rfqQuoteData which has the approved offering prices */}
                {isFromRfq && rfqQuoteData && rfqQuoteData.quoteProducts?.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
                      {t("rfq_products") || "RFQ Products"}
                    </h3>
                    <div className="space-y-4">
                      {rfqQuoteData.quoteProducts.map((quoteProduct: any, index: number) => {
                        // Find the product details from rfqQuoteDetails for display (name, image, etc.)
                        const product = rfqQuoteDetails?.rfqQuotesProducts?.find((p: any) => p.id === quoteProduct.id);
                        // Always use the offerPrice from quoteProduct (this is the approved offering price from vendor)
                        const displayPrice = parseFloat(quoteProduct.offerPrice || "0");
                        const productImage = product?.rfqProductDetails?.productImages?.[0]?.image;
                        return (
                          <div key={quoteProduct.id || index} className="border border-border rounded-lg p-4 bg-muted">
                            <div className="flex items-start gap-4">
                              {productImage && (
                                <Image
                                  src={productImage}
                                  alt={product?.rfqProductDetails?.productName || "Product"}
                                  width={80}
                                  height={80}
                                  className="rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-1">
                                  {product?.rfqProductDetails?.productName || "Product"}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {t("quantity")}: {quoteProduct.quantity || product?.quantity || 1}
                                </p>
                                <p className="text-lg font-semibold text-foreground">
                                  {currency.symbol}{displayPrice}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* NEW: Display Selected Suggested Products */}
                {isFromRfq && rfqQuoteData && rfqQuoteData.suggestedProducts && rfqQuoteData.suggestedProducts.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
                      {t("suggested_alternative_products") || "Suggested Alternative Products"}
                    </h3>
                    <div className="space-y-4">
                      {rfqQuoteData.suggestedProducts.map((suggestedProduct: any, index: number) => {
                        const displayPrice = parseFloat(suggestedProduct.offerPrice || "0");
                        const productImage = suggestedProduct.productImage;
                        return (
                          <div key={suggestedProduct.id || index} className="border-2 border-info/20 rounded-lg p-4 bg-info/5">
                            <div className="flex items-start gap-4">
                              {productImage && validator.isURL(productImage) ? (
                                <Image
                                  src={productImage}
                                  alt={suggestedProduct.productName || "Product"}
                                  width={80}
                                  height={80}
                                  className="rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                                  <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground">
                                    {suggestedProduct.productName || "Product"}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-full bg-info/10 text-info text-xs font-medium">
                                    {t("suggested") || "Suggested"}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {t("quantity")}: {suggestedProduct.quantity || 1}
                                </p>
                                <p className="text-lg font-semibold text-foreground">
                                  {currency.symbol}{displayPrice}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {isFromRfq && rfqQuoteDetails && rfqQuoteDetails.rfqQuotesProducts?.length > 0 && (!rfqQuoteData || !rfqQuoteData.quoteProducts?.length) ? (
                  // Fallback: If rfqQuoteData is not available, use rfqQuoteDetails
                  <div className="space-y-4">
                    {rfqQuoteDetails.rfqQuotesProducts.map((product: any, index: number) => {
                      const quoteProduct = rfqQuoteData?.quoteProducts?.find((qp: any) => qp.id === product.id);
                      // Use quoteProduct offerPrice first (approved price), then product offerPrice
                      const displayPrice = parseFloat(quoteProduct?.offerPrice || product.offerPrice || "0");
                      const productImage = product?.rfqProductDetails?.productImages?.[0]?.image;
                      return (
                        <div key={product.id || index} className="border border-border rounded-lg p-4 bg-muted">
                          <div className="flex items-start gap-4">
                            {productImage && (
                              <Image
                                src={productImage}
                                alt={product?.rfqProductDetails?.productName || "Product"}
                                width={80}
                                height={80}
                                className="rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-1">
                                {product?.rfqProductDetails?.productName || "Product"}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {t("quantity")}: {quoteProduct?.quantity || product.quantity || 1}
                              </p>
                              <p className="text-lg font-semibold text-foreground">
                                {currency.symbol}{displayPrice}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : memoizedCartList.filter((item: any) => item.productId).length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
                      {t("products")}
                    </h3>
                    
                    <div className="space-y-4">
                      {sellerIds.map((sellerId: number, index: number) => {
                        return (
                          <div key={sellerId} className="border border-border rounded-lg p-4 bg-muted">
                            <div className="space-y-4">
                              {memoizedCartList
                                ?.filter(
                                  (item: CartItem) =>
                                    item.productPriceDetails && item.productPriceDetails.adminId == sellerId,
                                )
                                ?.map((item: CartItem) => {
                                  const productInfo = productPricingInfoMap.get(item.productId);
                                  return (
                                  <ProductCard
                                    key={item.id}
                                    cartId={item.id}
                                    productId={item.productId}
                                    productPriceId={item.productPriceId}
                                    productName={
                                      item.productPriceDetails?.productPrice_product
                                        ?.productName
                                    }
                                    offerPrice={item.productPriceDetails?.offerPrice}
                                    productQuantity={item.quantity}
                                    productVariant={item.object}
                                    productImages={
                                      item.productPriceDetails?.productPrice_product
                                        ?.productImages
                                    }
                                    consumerDiscount={
                                      productInfo?.consumerDiscount ?? item.productPriceDetails?.consumerDiscount ?? 0
                                    }
                                    consumerDiscountType={
                                      productInfo?.consumerDiscountType ?? item.productPriceDetails?.consumerDiscountType
                                    }
                                    vendorDiscount={
                                      productInfo?.vendorDiscount ?? item.productPriceDetails?.vendorDiscount ?? 0
                                    }
                                    vendorDiscountType={
                                      productInfo?.vendorDiscountType ?? item.productPriceDetails?.vendorDiscountType
                                    }
                                    consumerType={productInfo?.consumerType ?? (item.productPriceDetails as any)?.consumerType}
                                    categoryId={productInfo?.categoryId ?? (item.productPriceDetails as any)?.productCategoryId}
                                    categoryLocation={productInfo?.categoryLocation ?? (item.productPriceDetails as any)?.productCategoryLocation}
                                    categoryConnections={productInfo?.categoryConnections || []}
                                    onAdd={handleAddToCart}
                                    onRemove={(cartId: number) => {
                                      setIsConfirmDialogOpen(true);
                                      setSelectedCartId(cartId);
                                    }}
                                    onWishlist={handleAddToWishlist}
                                    haveAccessToken={haveAccessToken}
                                    invalidProduct={invalidProducts.includes(
                                      item.productId,
                                    )}
                                    cannotBuy={notAvailableProducts.includes(
                                      item.productId,
                                    )}
                                  />
                                  );
                                }) || []}
                              
                              {/* Shipping Options */}
                              <div className="mt-4 p-4 bg-card rounded-lg border border-border">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-3" dir={langDir} translate="no">
                                  Shipping Options
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Shipping Method</Label>
                                    <Select
                                      className="mt-1"
                                      options={shippingOptions()}
                                      value={shippingOptions().find(
                                        (option) =>
                                          shippingInfo[index].shippingType ==
                                          option.value,
                                      )}
                                      menuPlacement="auto"
                                      menuPortalTarget={
                                        typeof document !== "undefined"
                                          ? document.body
                                          : undefined
                                      }
                                      styles={{
                                        menuPortal: (base) => ({
                                          ...base,
                                          zIndex: 9999,
                                        }),
                                        menu: (base) => ({
                                          ...base,
                                          zIndex: 9999,
                                        }),
                                      }}
                                      onChange={(newValue: any) => {
                                        const data = shippingInfo;
                                        data[index].shippingType = newValue?.value;
                                        data[index].info.serviceId = null;
                                        data[index].info.serviceName = null;
                                        data[index].info.shippingCharge = 0;
                                        setShippingInfo([...data]);
                                      }}
                                    />
                                  </div>

                                  {["SELLERDROP", "PLATFORM"].includes(
                                    shippingInfo[index].shippingType,
                                  ) && (
                                    <>
                                      <div className="flex items-end">
                                        <Button
                                          onClick={() => {
                                            setSelectedSellerId(sellerId);
                                            setSelectedShippingType(
                                              shippingInfo[index].shippingType,
                                            );
                                            const item = memoizedCartList?.find(
                                              (item: CartItem) =>
                                                item.productPriceDetails.adminId ==
                                                sellerId,
                                            );
                                            if (item) {
                                              setFromCityId(
                                                item.productPriceDetails?.productCityId,
                                              );
                                            }
                                            const address = memoziedAddressList.find(
                                              (item: any) =>
                                                item.id == selectedShippingAddressId,
                                            );
                                            if (address) {
                                              setToCityId(address.cityId);
                                            }
                                            setIsShippingModalOpen(true);
                                          }}
                                          variant="outline"
                                          size="sm"
                                          translate="no"
                                        >
                                          {t("select_service")}
                                        </Button>
                                      </div>

                                      <div>
                                        {shippingInfo[index]?.info?.serviceId ? (
                                          <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                                            <p className="text-sm font-medium text-success">
                                              {shippingInfo[index].info.serviceName}
                                            </p>
                                          </div>
                                        ) : (
                                          <span className="text-sm text-destructive">
                                            {shippingErrors?.[index]?.errors?.serviceId ||
                                              "Please select a shipping service"}
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {memoizedCartList.filter((item: any) => item.serviceId).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4" dir={langDir} translate="no">
                      {t("services")}
                    </h3>
                    
                    <div className="space-y-4">
                      {memoizedCartList.filter((item: any) => item.serviceId).map((item: any) => {
                        if (!item.cartServiceFeatures?.length) return null;

                        const features = item.cartServiceFeatures.map((feature: any) => ({
                          id: feature.id,
                          serviceFeatureId: feature.serviceFeatureId,
                          quantity: feature.quantity
                        }));

                        const relatedCart: any = memoizedCartList
                          ?.filter((c: any) => c.productId && c.cartProductServices?.length)
                          .find((c: any) => {
                              return !!c.cartProductServices
                                  .find((r: any) => r.relatedCartType == 'SERVICE' && r.serviceId == item.serviceId);
                          });

                        return item.cartServiceFeatures.map((feature: any) => {
                          return (
                            <ServiceCard 
                              key={feature.id}
                              cartId={item.id}
                              serviceId={item.serviceId}
                              serviceFeatureId={feature.serviceFeatureId}
                              serviceFeatureName={feature.serviceFeature.name}
                              serviceCost={Number(feature.serviceFeature.serviceCost)}
                              cartQuantity={feature.quantity}
                              serviceFeatures={features}
                              relatedCart={relatedCart}
                              onRemove={() => {
                                handleRemoveServiceFromCart(item.id, feature.id);
                              }}
                            />
                          );
                        });
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Guest Information */}
            {!me.data && (
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted">
                  <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
                    {t("your_informations")}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="max-w-md">
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block" dir={langDir} translate="no">
                      {t("email")}
                    </Label>
                    <Input
                      className="w-full"
                      placeholder={t("enter_email")}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      value={guestEmail}
                      dir={langDir}
                      translate="no"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted">
                <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
                  {me?.data
                    ? t("select_shipping_address")
                    : t("shipping_address")}
                </h2>
              </div>

              <div className="p-6">
                <RadioGroup
                  value={selectedShippingAddressId?.toString()}
                  onValueChange={(value) =>
                    setSelectedShippingAddressId(value)
                  }
                  className="space-y-4"
                >
                  {memoziedAddressList?.map((item: AddressItem) => (
                    <AddressCard
                      key={item.id}
                      id={item.id}
                      firstName={item.firstName}
                      lastName={item.lastName}
                      cc={item.cc}
                      phoneNumber={item.phoneNumber}
                      address={item.address}
                      town={item.town}
                      city={item.cityDetail}
                      country={item.countryDetail}
                      state={item.stateDetail}
                      postCode={item.postCode}
                      onEdit={() => {
                        setSelectedAddressId(item.id);
                        handleToggleAddModal();
                      }}
                      onDelete={() => handleDeleteAddress(item.id)}
                      onSelectAddress={() =>
                        handleOrderDetails(item, "shipping")
                      }
                    />
                  ))}
                </RadioGroup>

                {guestShippingAddress && (
                  <div className="mt-4">
                    <GuestAddressCard
                      firstName={guestShippingAddress?.firstName}
                      lastName={guestShippingAddress?.lastName}
                      cc={guestShippingAddress?.cc}
                      phoneNumber={guestShippingAddress?.phoneNumber}
                      address={guestShippingAddress?.address}
                      city={guestShippingAddress?.city}
                      town={guestShippingAddress?.town}
                      state={guestShippingAddress?.state}
                      country={guestShippingAddress?.country}
                      postCode={guestShippingAddress?.postCode}
                      onEdit={() => {
                        setAddressType("shipping");
                        handleToggleAddModal();
                      }}
                    />
                  </div>
                )}
              </div>

              {!me.data && !guestShippingAddress && (
                <div className="px-6 pb-6">
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full border-dashed border-2 border-border hover:border-border bg-transparent hover:bg-muted"
                    onClick={() => {
                      setAddressType("shipping");
                      handleToggleAddModal();
                    }}
                    translate="no"
                  >
                    <Image
                      src={AddIcon}
                      alt="add-icon"
                      height={16}
                      width={16}
                      className="mr-2"
                    />
                    {t("add_new_shipping_address")}
                  </Button>
                </div>
              )}
            </div>

            {/* Billing Address - Read-only from Profile */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted">
                <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
                  {t("billing_address")}
                </h2>
              </div>

              <div className="p-6">
                {me.data ? (
                  // Logged-in user: Show billing from profile (read-only)
                  selectedOrderDetails?.billingAddress ? (
                    <div className="border border-border rounded-lg p-4 bg-muted">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <svg
                              className="w-5 h-5 text-muted-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <p className="font-semibold text-foreground" dir={langDir}>
                              {selectedOrderDetails.firstName} {selectedOrderDetails.lastName}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1" dir={langDir}>
                            {selectedOrderDetails.cc} {selectedOrderDetails.phone}
                          </p>
                          <p className="text-sm text-muted-foreground mb-1" dir={langDir}>
                            {selectedOrderDetails.email}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2" dir={langDir}>
                            {selectedOrderDetails.billingAddress}
                          </p>
                          <p className="text-sm text-muted-foreground" dir={langDir}>
                            {selectedOrderDetails.billingCity}, {selectedOrderDetails.billingProvince}, {selectedOrderDetails.billingCountry} {selectedOrderDetails.billingPostCode}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground" dir={langDir} translate="no">
                        {t("no_billing_address_available")}
                      </p>
                    </div>
                  )
                ) : (
                  // Guest user: Show guest billing address
                  guestBillingAddress ? (
                    <div className="mt-4">
                      <GuestAddressCard
                        firstName={guestBillingAddress?.firstName}
                        lastName={guestBillingAddress?.lastName}
                        cc={guestBillingAddress?.cc}
                        phoneNumber={guestBillingAddress?.phoneNumber}
                        address={guestBillingAddress?.address}
                        city={guestBillingAddress?.city}
                        town={guestBillingAddress?.town}
                        state={guestBillingAddress?.state}
                        country={guestBillingAddress?.country}
                        postCode={guestBillingAddress?.postCode}
                        onEdit={() => {
                          setAddressType("billing");
                          handleToggleAddModal();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="px-6 pb-6">
                      <Button
                        variant="outline"
                        type="button"
                        className="w-full border-dashed border-2 border-border hover:border-border bg-transparent hover:bg-muted"
                        onClick={() => {
                          setAddressType("billing");
                          handleToggleAddModal();
                        }}
                        translate="no"
                      >
                        <Image
                          src={AddIcon}
                          alt="add-icon"
                          height={16}
                          width={16}
                          className="mr-2"
                        />
                        {t("add_new_billing_address")}
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Add New Address Button for logged-in users - Only for Shipping */}
            {me.data && (
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6">
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full border-dashed border-2 border-border hover:border-border bg-transparent hover:bg-muted"
                    onClick={() => {
                      setAddressType("shipping");
                      handleToggleAddModal();
                    }}
                    dir={langDir}
                    translate="no"
                  >
                    <Image
                      src={AddIcon}
                      alt="add-icon"
                      height={16}
                      width={16}
                      className="mr-2"
                    />
                    {t("add_new_address")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted">
                  <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
                    {t("order_summary")}
                  </h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground" dir={langDir} translate="no">
                      {t("subtotal")}
                    </span>
                    <span className="font-semibold text-foreground">
                      {currency.symbol}{itemsTotal}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground" dir={langDir} translate="no">
                      {t("shipping")}
                    </span>
                    <span className="font-semibold text-foreground">
                      {shippingCharge > 0 ? (
                        `${currency.symbol}${shippingCharge}`
                      ) : (
                        <span className="text-success font-medium">{t("free")}</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground" dir={langDir} translate="no">
                      {t("fee")}
                    </span>
                    <span className="font-semibold text-foreground">
                      {currency.symbol}{fee}
                    </span>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground" dir={langDir} translate="no">
                        {t("total_amount")}
                      </span>
                      <span className="text-xl font-bold text-foreground">
                        {currency.symbol}{totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-6">
                  <Button
                    onClick={onSaveOrder}
                    disabled={
                      (isFromRfq ? !rfqQuoteData : !memoizedCartList?.length) ||
                      updateCartByDevice?.isPending ||
                      updateCartWithLogin?.isPending ||
                      cartListByDeviceQuery?.isFetching ||
                      cartListByUser?.isFetching ||
                      allUserAddressQuery?.isLoading ||
                      preOrderCalculation?.isPending ||
                      (isFromRfq && rfqQuoteDetailsQuery?.isLoading)
                    }
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors duration-200"
                    translate="no"
                  >
                    {preOrderCalculation?.isPending ? (
                      <LoaderWithMessage message={t("please_wait")} />
                    ) : (
                      t("place_order")
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={handleToggleAddModal}>
        <DialogContent
          className="add-new-address-modal gap-0 p-0"
          ref={wrapperRef}
        >
          {me.data ? (
            <AddressForm
              onClose={() => {
                setIsAddModalOpen(false);
                setSelectedAddressId(undefined);
                setAddressType("shipping"); // Reset to shipping
              }}
              addressId={selectedAddressId}
            />
          ) : (
            <GuestAddressForm
              onClose={() => {
                setIsAddModalOpen(false);
                setSelectedAddressId(undefined);
                setAddressType("shipping"); // Reset to shipping
              }}
              addressType={addressType || "shipping"} // Default to shipping
              setGuestShippingAddress={setGuestShippingAddress}
              setGuestBillingAddress={setGuestBillingAddress}
              guestShippingAddress={guestShippingAddress}
              guestBillingAddress={guestBillingAddress}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialog}>
        <DialogContent
          className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
          ref={confirmDialogRef}
        >
          <div className="modal-header justify-between!" dir={langDir}>
            <DialogTitle className="text-center text-xl font-bold text-dark-orange"></DialogTitle>
            <Button
              onClick={onCancelRemove}
              className={`${langDir == "ltr" ? "absolute" : ""} right-2 top-2 z-10 bg-card! text-foreground! shadow-none`}
            >
              <IoCloseSharp size={20} />
            </Button>
          </div>

          <div className="mb-4 mt-4 text-center">
            <p className="text-dark-orange">
              Do you want to remove this item from cart?
            </p>
            <div>
              <Button
                type="button"
                className="mr-2 bg-card text-destructive"
                onClick={onCancelRemove}
                translate="no"
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                className="bg-destructive"
                onClick={onConfirmRemove}
                translate="no"
              >
                {t("remove")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShippingModalOpen} onOpenChange={handleShippingModal}>
        <DialogContent
          className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
          ref={shippingModalRef}
        >
          <Shipping
            sellerId={selectedSellerId}
            type={`${selectedShippingType == "PLATFORM" ? "other" : "own"}`}
            fromCityId={fromCityId}
            toCityId={toCityId}
            onClose={() => {
              setSelectedSellerId(undefined);
              setSelectedShippingType(undefined);
              setFromCityId(undefined);
              setToCityId(undefined);
              setIsShippingModalOpen(false);
            }}
            onSelect={(sellerId: number, item: any) => {
              const index = shippingInfo.findIndex(
                (item: any) => item.sellerId == sellerId,
              );
              const shipping = shippingInfo.find(
                (item: any) => item.sellerId == sellerId,
              );
              if (shipping) {
                const info = shippingInfo;
                info[index].info.serviceId = item.id;
                info[index].info.serviceName = item.serviceName;
                info[index].info.shippingCharge = Number(
                  item.serviceFeatures?.[0]?.serviceCost,
                );
                setShippingInfo([...info]);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckoutPage;
