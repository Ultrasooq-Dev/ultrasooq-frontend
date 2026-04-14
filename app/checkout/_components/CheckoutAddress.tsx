"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import AddressCard from "@/components/modules/checkout/AddressCard";
import GuestAddressCard from "@/components/modules/checkout/GuestAddressCard";
import Image from "next/image";
import AddIcon from "@/public/images/addbtn.svg";
import { AddressItem } from "@/utils/types/address.types";
import { GuestAddress } from "./checkoutTypes";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface CheckoutAddressProps {
  me: any;
  memoziedAddressList: AddressItem[];
  selectedShippingAddressId: string | null;
  setSelectedShippingAddressId: (v: string | null) => void;
  selectedOrderDetails: any;
  guestShippingAddress: GuestAddress | undefined;
  guestBillingAddress: GuestAddress | undefined;
  guestEmail: string;
  setGuestEmail: (v: string) => void;
  setAddressType: (v: "shipping" | "billing") => void;
  handleToggleAddModal: () => void;
  handleOrderDetails: (item: AddressItem, type: "shipping" | "billing") => void;
  handleDeleteAddress: (id: number) => void;
  setSelectedAddressId: (id: number) => void;
}

const CheckoutAddress: React.FC<CheckoutAddressProps> = ({
  me,
  memoziedAddressList,
  selectedShippingAddressId,
  setSelectedShippingAddressId,
  selectedOrderDetails,
  guestShippingAddress,
  guestBillingAddress,
  guestEmail,
  setGuestEmail,
  setAddressType,
  handleToggleAddModal,
  handleOrderDetails,
  handleDeleteAddress,
  setSelectedAddressId,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <>
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
            {me?.data ? t("select_shipping_address") : t("shipping_address")}
          </h2>
        </div>
        <div className="p-6">
          <RadioGroup
            value={selectedShippingAddressId?.toString()}
            onValueChange={(value) => setSelectedShippingAddressId(value)}
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
                onEdit={() => { setSelectedAddressId(item.id); handleToggleAddModal(); }}
                onDelete={() => handleDeleteAddress(item.id)}
                onSelectAddress={() => handleOrderDetails(item, "shipping")}
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
              onClick={() => { setAddressType("shipping"); handleToggleAddModal(); }}
              translate="no"
            >
              <Image src={AddIcon} alt="add-icon" height={16} width={16} className="mr-2" />
              {t("add_new_shipping_address")}
            </Button>
          </div>
        )}
      </div>

      {/* Billing Address */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted">
          <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
            {t("billing_address")}
          </h2>
        </div>
        <div className="p-6">
          {me.data ? (
            selectedOrderDetails?.billingAddress ? (
              <div className="border border-border rounded-lg p-4 bg-muted">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                      {selectedOrderDetails.billingCity}, {selectedOrderDetails.billingProvince},{" "}
                      {selectedOrderDetails.billingCountry} {selectedOrderDetails.billingPostCode}
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
          ) : guestBillingAddress ? (
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
                onEdit={() => { setAddressType("billing"); handleToggleAddModal(); }}
              />
            </div>
          ) : (
            <div className="px-6 pb-6">
              <Button
                variant="outline"
                type="button"
                className="w-full border-dashed border-2 border-border hover:border-border bg-transparent hover:bg-muted"
                onClick={() => { setAddressType("billing"); handleToggleAddModal(); }}
                translate="no"
              >
                <Image src={AddIcon} alt="add-icon" height={16} width={16} className="mr-2" />
                {t("add_new_billing_address")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add New Address for logged-in users */}
      {me.data && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-6">
            <Button
              variant="outline"
              type="button"
              className="w-full border-dashed border-2 border-border hover:border-border bg-transparent hover:bg-muted"
              onClick={() => { setAddressType("shipping"); handleToggleAddModal(); }}
              dir={langDir}
              translate="no"
            >
              <Image src={AddIcon} alt="add-icon" height={16} width={16} className="mr-2" />
              {t("add_new_address")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default CheckoutAddress;
