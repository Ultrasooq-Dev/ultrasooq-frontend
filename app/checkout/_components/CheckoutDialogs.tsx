"use client";
import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddressForm from "@/components/modules/checkout/AddressForm";
import GuestAddressForm from "@/components/modules/checkout/GuestAddressForm";
import Shipping from "@/components/modules/checkout/Shipping";
import { IoCloseSharp } from "react-icons/io5";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { GuestAddress } from "./checkoutTypes";

interface CheckoutDialogsProps {
  // Address modal
  isAddModalOpen: boolean;
  handleToggleAddModal: () => void;
  wrapperRef: React.RefObject<any>;
  me: any;
  selectedAddressId: number | undefined;
  setIsAddModalOpen: (v: boolean) => void;
  setSelectedAddressId: (v: number | undefined) => void;
  setAddressType: (v: "shipping" | "billing") => void;
  addressType: "shipping" | "billing" | undefined;
  guestShippingAddress: GuestAddress | undefined;
  guestBillingAddress: GuestAddress | undefined;
  setGuestShippingAddress: (v: GuestAddress | undefined) => void;
  setGuestBillingAddress: (v: GuestAddress | undefined) => void;
  // Confirm remove modal
  isConfirmDialogOpen: boolean;
  handleConfirmDialog: () => void;
  confirmDialogRef: React.RefObject<any>;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
  // Shipping modal
  isShippingModalOpen: boolean;
  handleShippingModal: () => void;
  shippingModalRef: React.RefObject<any>;
  selectedSellerId: number | undefined;
  selectedShippingType: string | undefined;
  fromCityId: number | undefined;
  toCityId: number | undefined;
  setSelectedSellerId: (v: number | undefined) => void;
  setSelectedShippingType: (v: string | undefined) => void;
  setFromCityId: (v: number | undefined) => void;
  setToCityId: (v: number | undefined) => void;
  setIsShippingModalOpen: (v: boolean) => void;
  shippingInfo: any[];
  setShippingInfo: (v: any[]) => void;
}

const CheckoutDialogs: React.FC<CheckoutDialogsProps> = ({
  isAddModalOpen,
  handleToggleAddModal,
  wrapperRef,
  me,
  selectedAddressId,
  setIsAddModalOpen,
  setSelectedAddressId,
  setAddressType,
  addressType,
  guestShippingAddress,
  guestBillingAddress,
  setGuestShippingAddress,
  setGuestBillingAddress,
  isConfirmDialogOpen,
  handleConfirmDialog,
  confirmDialogRef,
  onCancelRemove,
  onConfirmRemove,
  isShippingModalOpen,
  handleShippingModal,
  shippingModalRef,
  selectedSellerId,
  selectedShippingType,
  fromCityId,
  toCityId,
  setSelectedSellerId,
  setSelectedShippingType,
  setFromCityId,
  setToCityId,
  setIsShippingModalOpen,
  shippingInfo,
  setShippingInfo,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <>
      {/* Address Form Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleToggleAddModal}>
        <DialogContent className="add-new-address-modal gap-0 p-0" ref={wrapperRef}>
          {me.data ? (
            <AddressForm
              onClose={() => {
                setIsAddModalOpen(false);
                setSelectedAddressId(undefined);
                setAddressType("shipping");
              }}
              addressId={selectedAddressId}
            />
          ) : (
            <GuestAddressForm
              onClose={() => {
                setIsAddModalOpen(false);
                setSelectedAddressId(undefined);
                setAddressType("shipping");
              }}
              addressType={addressType || "shipping"}
              setGuestShippingAddress={setGuestShippingAddress}
              setGuestBillingAddress={setGuestBillingAddress}
              guestShippingAddress={guestShippingAddress}
              guestBillingAddress={guestBillingAddress}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Cart Item Modal */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialog}>
        <DialogContent
          className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
          ref={confirmDialogRef}
        >
          <div className="modal-header justify-between!" dir={langDir}>
            <DialogTitle className="text-center text-xl font-bold text-dark-orange" />
            <Button
              onClick={onCancelRemove}
              className={`${langDir === "ltr" ? "absolute" : ""} right-2 top-2 z-10 bg-card! text-foreground! shadow-none`}
            >
              <IoCloseSharp size={20} />
            </Button>
          </div>
          <div className="mb-4 mt-4 text-center">
            <p className="text-dark-orange">Do you want to remove this item from cart?</p>
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

      {/* Shipping Service Modal */}
      <Dialog open={isShippingModalOpen} onOpenChange={handleShippingModal}>
        <DialogContent
          className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
          ref={shippingModalRef}
        >
          <Shipping
            sellerId={selectedSellerId}
            type={`${selectedShippingType === "PLATFORM" ? "other" : "own"}`}
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
              const index = shippingInfo.findIndex((i: any) => i.sellerId === sellerId);
              const shipping = shippingInfo.find((i: any) => i.sellerId === sellerId);
              if (shipping) {
                const info = [...shippingInfo];
                info[index].info.serviceId = item.id;
                info[index].info.serviceName = item.serviceName;
                info[index].info.shippingCharge = Number(item.serviceFeatures?.[0]?.serviceCost);
                setShippingInfo(info);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CheckoutDialogs;
