"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

import {
  BulkEditSidebarProps,
  BulkEditFormValues,
  BULK_EDIT_DEFAULT_VALUES,
  ActiveTab,
  ConfirmAction,
} from "./bulkEditTypes";
import { useBulkEditLocation } from "./useBulkEditLocation";
import { useBulkEditActions } from "./useBulkEditActions";
import BulkEditTabNav from "./BulkEditTabNav";
import BulkEditConfirmDialog from "./BulkEditConfirmDialog";
import BulkEditLocationTab from "./BulkEditLocationTab";
import BulkEditProductTab from "./BulkEditProductTab";
import BulkEditAskForTab from "./BulkEditAskForTab";
import BulkEditDiscountsTab from "./BulkEditDiscountsTab";

const BulkEditSidebar: React.FC<BulkEditSidebarProps> = ({
  onBulkUpdate,
  selectedProducts,
  onUpdate,
  isLoading = false,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>("warehouse-location");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<BulkEditFormValues>({ defaultValues: BULK_EDIT_DEFAULT_VALUES });

  const watchSellType = form.watch("sellType");
  const watchConsumerType = form.watch("consumerType");
  const watchProductCondition = form.watch("productCondition");
  const watchUpdateWarehouse = form.watch("updateWarehouse");
  const watchUpdateWhereToSell = form.watch("updateWhereToSell");
  const watchUpdateBasic = form.watch("updateBasic");
  const watchUpdateDiscounts = form.watch("updateDiscounts");
  const watchUpdateAskFor = form.watch("updateAskFor");
  const watchAskForPrice = form.watch("askForPrice");
  const watchAskForStock = form.watch("askForStock");

  // ── Location data + handlers ─────────────────────────────────────────────
  const {
    selectedCountries,
    setSelectedCountries,
    selectedStates,
    setSelectedStates,
    selectedCities,
    setSelectedCities,
    statesByCountry,
    citiesByState,
    memoizedAllCountries,
    memoizedBranches,
    groupedStateOptions,
    groupedCityOptions,
  } = useBulkEditLocation(form);

  // ── Action handlers ───────────────────────────────────────────────────────
  const {
    executeHideShow,
    handleBulkProductCondition,
    handleBulkDiscountUpdate,
    handleBulkWhereToSellUpdate,
    handleBulkAskForUpdate,
    onSubmit,
  } = useBulkEditActions({
    form,
    selectedProducts,
    onUpdate,
    onBulkUpdate,
    selectedCountries,
    selectedStates,
    selectedCities,
    setSelectedCountries,
    setSelectedStates,
    setSelectedCities,
    watchAskForPrice,
    watchAskForStock,
  });

  const handleShowConfirmation = (hide: boolean) => {
    const count = selectedProducts.length;
    setConfirmAction({
      message: `Are you sure you want to ${hide ? "hide" : "show"} ${count} selected product${count !== 1 ? "s" : ""} ${hide ? "from" : "to"} customers?`,
      onConfirm: () => {
        setShowConfirmDialog(false);
        setConfirmAction(null);
        executeHideShow(hide, () => {});
      },
      type: hide ? "hide" : "show",
    });
    setShowConfirmDialog(true);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden" dir={langDir}>
      {/* Confirm dialog */}
      {showConfirmDialog && confirmAction && (
        <BulkEditConfirmDialog
          confirmAction={confirmAction}
          onCancel={() => {
            setShowConfirmDialog(false);
            setConfirmAction(null);
          }}
        />
      )}

      {/* Selection count */}
      <div className="border-b border-border bg-card px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          {selectedProducts.length} product{selectedProducts.length !== 1 ? "s" : ""} selected
        </p>
      </div>

      {/* Tab nav */}
      <BulkEditTabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {activeTab === "warehouse-location" && (
            <BulkEditLocationTab
              form={form}
              watchUpdateWarehouse={watchUpdateWarehouse}
              watchUpdateWhereToSell={watchUpdateWhereToSell}
              memoizedBranches={memoizedBranches}
              memoizedAllCountries={memoizedAllCountries}
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
              selectedStates={selectedStates}
              setSelectedStates={setSelectedStates}
              selectedCities={selectedCities}
              setSelectedCities={setSelectedCities}
              statesByCountry={statesByCountry}
              citiesByState={citiesByState}
              groupedStateOptions={groupedStateOptions}
              groupedCityOptions={groupedCityOptions}
              onUpdateWhereToSell={handleBulkWhereToSellUpdate}
            />
          )}

          {activeTab === "product-basic" && (
            <BulkEditProductTab
              form={form}
              watchUpdateBasic={watchUpdateBasic}
              watchProductCondition={watchProductCondition}
              onProductCondition={handleBulkProductCondition}
              onShowConfirmation={handleShowConfirmation}
            />
          )}

          {activeTab === "ask-for" && (
            <BulkEditAskForTab
              form={form}
              watchUpdateAskFor={watchUpdateAskFor}
              watchAskForPrice={watchAskForPrice}
              watchAskForStock={watchAskForStock}
              onUpdate={handleBulkAskForUpdate}
            />
          )}

          {activeTab === "discounts" && (
            <BulkEditDiscountsTab
              form={form}
              watchUpdateDiscounts={watchUpdateDiscounts}
              watchConsumerType={watchConsumerType}
              watchSellType={watchSellType}
              onUpdate={handleBulkDiscountUpdate}
            />
          )}

          {/* Global update button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || selectedProducts.length === 0}
            >
              {isLoading ? t("updating") : t("update_selected")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditSidebar;
