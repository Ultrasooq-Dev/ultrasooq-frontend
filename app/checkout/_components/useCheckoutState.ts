"use client";
import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "use-events";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { OrderDetails } from "@/utils/types/orders.types";
import {
  GuestAddress,
  ShippingInfoItem,
  ShippingErrorItem,
} from "./checkoutTypes";
import { useCheckoutAddressInit } from "./useCheckoutAddressInit";

export const useCheckoutState = (
  meData: any,
  memoziedAddressList: any[],
) => {
  const router = useRouter();
  const wrapperRef = useRef(null);
  const confirmDialogRef = useRef(null);
  const shippingModalRef = useRef(null);

  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);

  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<
    number | undefined
  >();
  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<OrderDetails>();
  const [addressType, setAddressType] = useState<"shipping" | "billing">();
  const [guestShippingAddress, setGuestShippingAddress] = useState<
    GuestAddress | undefined
  >();
  const [guestBillingAddress, setGuestBillingAddress] = useState<
    GuestAddress | undefined
  >();
  const [guestEmail, setGuestEmail] = useState("");
  const [itemsTotal, setItemsTotal] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [sellerIds, setSellerIds] = useState<number[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfoItem[]>([]);
  const [shippingErrors, setShippingErrors] = useState<ShippingErrorItem[]>([]);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  const [rfqQuoteData, setRfqQuoteData] = useState<any>(null);
  const [isFromRfq, setIsFromRfq] = useState<boolean>(false);
  const [selectedCartId, setSelectedCartId] = useState<number>();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState<boolean>(false);
  const [selectedSellerId, setSelectedSellerId] = useState<number>();
  const [selectedShippingType, setSelectedShippingType] = useState<string>();
  const [fromCityId, setFromCityId] = useState<number>();
  const [toCityId, setToCityId] = useState<number>();
  const [isShippingModalOpen, setIsShippingModalOpen] =
    useState<boolean>(false);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<
    string | null
  >(null);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<
    string | null
  >(null);
  const [invalidProducts, setInvalidProducts] = useState<number[]>([]);
  const [notAvailableProducts, setNotAvailableProducts] = useState<number[]>(
    [],
  );

  const handleConfirmDialog = () => setIsConfirmDialogOpen((prev) => !prev);
  const handleShippingModal = () => setIsShippingModalOpen((prev) => !prev);
  const handleToggleAddModal = () => setIsAddModalOpen((prev) => !prev);

  const [isClickedOutsideConfirmDialog] = useClickOutside(
    [confirmDialogRef],
    () => {
      setIsConfirmDialogOpen(false);
      setSelectedCartId(undefined);
    },
  );

  const [isClickedOutside] = useClickOutside([wrapperRef], () => {});

  // Address init effects (outside-click, default address, billing from profile)
  const { handleOrderDetails } = useCheckoutAddressInit({
    meData,
    memoziedAddressList,
    isClickedOutside,
    setSelectedAddressId,
    setSelectedShippingAddressId,
    setSelectedOrderDetails: setSelectedOrderDetails as (fn: (prev: any) => any) => void,
  });

  // Load RFQ data from session storage
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

  // Recalculate RFQ totals when rfqQuoteData changes
  useEffect(() => {
    if (isFromRfq && rfqQuoteData) {
      const originalProductsTotal = (rfqQuoteData.quoteProducts || []).reduce(
        (total: number, quoteProduct: any) => {
          const price = parseFloat(quoteProduct.offerPrice || "0");
          const quantity = quoteProduct.quantity || 1;
          return total + price * quantity;
        },
        0,
      );
      const suggestedProductsTotal = (
        rfqQuoteData.suggestedProducts || []
      ).reduce((total: number, suggestedProduct: any) => {
        const price = parseFloat(suggestedProduct.offerPrice || "0");
        const quantity = suggestedProduct.quantity || 1;
        return total + price * quantity;
      }, 0);
      const calculatedTotal = originalProductsTotal + suggestedProductsTotal;
      const finalTotal = rfqQuoteData.totalPrice || calculatedTotal;
      setTotalAmount(finalTotal);
      setSubTotal(finalTotal);
      setItemsTotal(finalTotal);
    }
  }, [isFromRfq, rfqQuoteData]);

  // Auth redirect
  useEffect(() => {
    if (accessToken) {
      setHaveAccessToken(true);
    } else {
      setHaveAccessToken(false);
      router.push("/login?redirect=/checkout");
    }
  }, [accessToken, router]);

  // Update total when parts change
  useEffect(() => {
    setTotalAmount(itemsTotal + shippingCharge + fee);
  }, [itemsTotal, shippingCharge, fee]);

  // Update shipping charge from shippingInfo
  useEffect(() => {
    let charge = 0;
    for (const info of shippingInfo) {
      charge += info.info?.shippingCharge || 0;
    }
    setShippingCharge(charge);
  }, [shippingInfo]);

  return {
    router,
    wrapperRef,
    confirmDialogRef,
    shippingModalRef,
    haveAccessToken,
    setHaveAccessToken,
    isAddModalOpen,
    setIsAddModalOpen,
    selectedAddressId,
    setSelectedAddressId,
    selectedOrderDetails,
    setSelectedOrderDetails,
    addressType,
    setAddressType,
    guestShippingAddress,
    setGuestShippingAddress,
    guestBillingAddress,
    setGuestBillingAddress,
    guestEmail,
    setGuestEmail,
    itemsTotal,
    setItemsTotal,
    fee,
    setFee,
    subTotal,
    setSubTotal,
    totalAmount,
    setTotalAmount,
    sellerIds,
    setSellerIds,
    shippingInfo,
    setShippingInfo,
    shippingErrors,
    setShippingErrors,
    shippingCharge,
    rfqQuoteData,
    isFromRfq,
    selectedCartId,
    setSelectedCartId,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    handleConfirmDialog,
    selectedSellerId,
    setSelectedSellerId,
    selectedShippingType,
    setSelectedShippingType,
    fromCityId,
    setFromCityId,
    toCityId,
    setToCityId,
    isShippingModalOpen,
    setIsShippingModalOpen,
    handleShippingModal,
    handleToggleAddModal,
    selectedShippingAddressId,
    setSelectedShippingAddressId,
    selectedBillingAddressId,
    setSelectedBillingAddressId,
    invalidProducts,
    setInvalidProducts,
    notAvailableProducts,
    setNotAvailableProducts,
    isClickedOutsideConfirmDialog,
    handleOrderDetails,
  };
};
