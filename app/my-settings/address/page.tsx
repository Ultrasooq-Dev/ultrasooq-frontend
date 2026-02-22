"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import AddressCard from "@/components/modules/mySettings/address/AddressCard";
import { AddressItem } from "@/utils/types/address.types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddressForm from "@/components/modules/checkout/AddressForm";
import { useClickOutside } from "use-events";
import {
  useAllUserAddress,
  useDeleteAddress,
} from "@/apis/queries/address.queries";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { v4 as uuidv4 } from "uuid";
import { IoMdAdd } from "react-icons/io";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type AddressPageProps = {};

const AddressPage: React.FC<AddressPageProps> = ({}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();
  const wrapperRef = useRef(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<
    number | undefined
  >();

  const handleToggleAddModal = () => setIsAddModalOpen(!isAddModalOpen);

  const [isClickedOutside] = useClickOutside([wrapperRef], (event) => {});

  const allUserAddressQuery = useAllUserAddress({
    page: 1,
    limit: 10,
  });
  const delteAddress = useDeleteAddress();

  const memoziedAddressList = useMemo(() => {
    return allUserAddressQuery.data?.data || [];
  }, [allUserAddressQuery.data?.data]);

  const handleDeleteAddress = async (userAddressId: number) => {
    const response = await delteAddress.mutateAsync({ userAddressId });
    if (response.status) {
      toast({
        title: t("address_removed"),
        description: t("check_your_address_for_more_details"),
        variant: "success",
      });
    }
  };

  useEffect(() => {
    if (isClickedOutside) {
      setSelectedAddressId(undefined);
    }
  }, [isClickedOutside]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground" dir={langDir} translate="no">
              {t("manage_address")}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground" translate="no">
              {t("manage_your_saved_addresses")}
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
            type="button"
            onClick={() => handleToggleAddModal()}
            translate="no"
            dir={langDir}
          >
            <IoMdAdd size={20} className="shrink-0" /> {t("add_new_address")}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {allUserAddressQuery.isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => i).map((item) => (
            <div key={uuidv4()} className="overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-4 h-8 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!allUserAddressQuery.isLoading && !memoziedAddressList?.length && (
        <div className="overflow-hidden rounded-xl border-2 border-dashed border-border bg-card p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground" dir={langDir} translate="no">
            {t("no_address_found")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground" translate="no">
            {t("get_started_by_adding_a_new_address")}
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleToggleAddModal()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
              translate="no"
            >
              <IoMdAdd size={20} className="shrink-0" /> {t("add_new_address")}
            </button>
          </div>
        </div>
      )}

      {/* Address Cards Grid */}
      {!allUserAddressQuery.isLoading && memoziedAddressList?.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
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
                setIsAddModalOpen(true);
              }}
              onDelete={() => handleDeleteAddress(item.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleToggleAddModal}>
        <DialogContent
          className="add-new-address-modal gap-0 p-0"
          ref={wrapperRef}
        >
          <AddressForm
            onClose={() => {
              setIsAddModalOpen(false);
              setSelectedAddressId(undefined);
            }}
            addressId={selectedAddressId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressPage;
