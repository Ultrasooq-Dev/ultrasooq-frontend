"use client";
import { useEffect } from "react";
import { AddressItem } from "@/utils/types/address.types";

interface AddressInitDeps {
  meData: any;
  memoziedAddressList: any[];
  isClickedOutside: boolean;
  setSelectedAddressId: (v: number | undefined) => void;
  setSelectedShippingAddressId: (v: string | null) => void;
  setSelectedOrderDetails: (fn: (prev: any) => any) => void;
}

export const handleOrderDetailsUtil = (
  item: AddressItem,
  addresszType: "shipping" | "billing",
  meCurrentData: any,
  setSelectedOrderDetails: (fn: (prev: any) => any) => void,
) => {
  if (addresszType === "shipping") {
    setSelectedOrderDetails((prevState: any) => ({
      ...prevState,
      firstName: item.firstName || meCurrentData?.firstName,
      lastName: item.lastName || meCurrentData?.lastName,
      email: meCurrentData?.email,
      cc: item.cc,
      phone: item.phoneNumber,
      shippingAddress: item.address,
      shippingCity: item.cityDetail?.name,
      shippingProvince: item.stateDetail?.name,
      shippingCountry: item.countryDetail?.name,
      shippingPostCode: item.postCode,
    }));
  }
};

export const useCheckoutAddressInit = (deps: AddressInitDeps) => {
  const {
    meData,
    memoziedAddressList,
    isClickedOutside,
    setSelectedAddressId,
    setSelectedShippingAddressId,
    setSelectedOrderDetails,
  } = deps;

  // Handle outside click to deselect address
  useEffect(() => {
    if (isClickedOutside) setSelectedAddressId(undefined);
  }, [isClickedOutside]);

  // Set default shipping address when list loads
  useEffect(() => {
    if (memoziedAddressList.length > 0) {
      setSelectedShippingAddressId(memoziedAddressList[0].id.toString());
      handleOrderDetailsUtil(
        memoziedAddressList[0],
        "shipping",
        meData?.data,
        setSelectedOrderDetails,
      );
    }
  }, [memoziedAddressList]);

  // Initialize billing address from profile
  useEffect(() => {
    if (meData?.data) {
      const profileData = meData.data;
      const primaryPhone = profileData.userPhone?.[0] || {
        cc: profileData.cc || "",
        phoneNumber: profileData.phoneNumber || "",
      };
      const billingAddressData =
        memoziedAddressList.length > 0 ? memoziedAddressList[0] : null;
      setSelectedOrderDetails((prevState: any) => ({
        ...prevState,
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
        cc: primaryPhone.cc || "",
        phone: primaryPhone.phoneNumber || "",
        billingAddress: billingAddressData?.address || "",
        billingCity: billingAddressData?.cityDetail?.name || "",
        billingProvince: billingAddressData?.stateDetail?.name || "",
        billingCountry: billingAddressData?.countryDetail?.name || "",
        billingPostCode: billingAddressData?.postCode || "",
      }));
    }
  }, [meData, memoziedAddressList]);

  const handleOrderDetails = (
    item: AddressItem,
    addresszType: "shipping" | "billing",
  ) => {
    handleOrderDetailsUtil(
      item,
      addresszType,
      meData?.data,
      setSelectedOrderDetails,
    );
  };

  return { handleOrderDetails };
};
