import React from "react";
import { Label } from "@/components/ui/label";
import { IoMdCreate, IoMdRefresh, IoMdCreate as IoMdEdit } from "react-icons/io";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import ManageProductBaseFields from "./ManageProductBaseFields";
import ManageProductSellTypeFields from "./ManageProductSellTypeFields";

type ManageProductExpandedFieldsProps = {
  disableFields?: boolean;
  hideActionButtons?: boolean;
  stock: number;
  askForStock: string;
  askForPrice: string;
  productPrice: number;
  productCondition: string;
  deliveryAfter: number;
  consumerType: string;
  sellType: string;
  timeOpen: number;
  timeClose: number;
  vendorDiscount: number;
  vendorDiscountType: string | null;
  consumerDiscount: number;
  consumerDiscountType: string | null;
  minQuantity: number;
  maxQuantity: number;
  minCustomer: number;
  maxCustomer: number;
  minQuantityCustomer: number;
  maxQuantityCustomer: number;
  setStock: (v: number) => void;
  setProductPrice: (v: number) => void;
  setCondition: (v: string) => void;
  setConsumer: (v: string) => void;
  setSell: (v: string) => void;
  setDelivery: (v: number) => void;
  setTimeOpen: (v: number) => void;
  setTimeClose: (v: number) => void;
  setVendor: (v: number) => void;
  setVendorDiscountType: (v: string) => void;
  setConsumerDiscount: (v: number) => void;
  setConsumerDiscountType: (v: string) => void;
  setMinQuantity: (v: number) => void;
  setMaxQuantity: (v: number) => void;
  setMinCustomer: (v: number) => void;
  setMaxCustomer: (v: number) => void;
  setMaxQuantityCustomer: (v: number) => void;
  decreaseStock: () => void;
  increaseStock: () => void;
  decreasePrice: () => void;
  increasePrice: () => void;
  decreaseDeliveryDay: () => void;
  increaseDeliveryDay: () => void;
  decreaseTimeOpen: () => void;
  increaseTimeOpen: () => void;
  decreaseTimeClose: () => void;
  increaseTimeClose: () => void;
  decreaseVendorDiscount: () => void;
  increaseVendorDiscount: () => void;
  decreaseConsumerDiscount: () => void;
  increaseConsumerDiscount: () => void;
  decreaseMinQuantity: () => void;
  increaseMinQuantity: () => void;
  decreaseMaxsQuantity: () => void;
  increaseMaxQuantity: () => void;
  decreaseMinCustomer: () => void;
  increaseMinCustomer: () => void;
  decreaseMaxCustomer: () => void;
  increaseMaxCustomer: () => void;
  decreaseMaxQuantityCustomer: () => void;
  increaseMaxQuantityCustomer: () => void;
  onUpdate: (e: React.MouseEvent) => void;
  onReset: () => void;
  onEditProduct: () => void;
};

const ManageProductExpandedFields: React.FC<ManageProductExpandedFieldsProps> = (props) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const {
    disableFields, hideActionButtons,
    stock, askForStock, askForPrice, productPrice,
    productCondition, deliveryAfter, consumerType, sellType,
    timeOpen, timeClose, vendorDiscount, vendorDiscountType,
    consumerDiscount, consumerDiscountType,
    minQuantity, maxQuantity, minCustomer, maxCustomer,
    minQuantityCustomer, maxQuantityCustomer,
    setStock, setProductPrice, setCondition, setConsumer, setSell,
    setDelivery, setTimeOpen, setTimeClose,
    setVendor, setVendorDiscountType, setConsumerDiscount, setConsumerDiscountType,
    setMinQuantity, setMaxQuantity, setMinCustomer, setMaxCustomer, setMaxQuantityCustomer,
    decreaseStock, increaseStock, decreasePrice, increasePrice,
    decreaseDeliveryDay, increaseDeliveryDay,
    decreaseTimeOpen, increaseTimeOpen, decreaseTimeClose, increaseTimeClose,
    decreaseVendorDiscount, increaseVendorDiscount,
    decreaseConsumerDiscount, increaseConsumerDiscount,
    decreaseMinQuantity, increaseMinQuantity, decreaseMaxsQuantity, increaseMaxQuantity,
    decreaseMinCustomer, increaseMinCustomer, decreaseMaxCustomer, increaseMaxCustomer,
    decreaseMaxQuantityCustomer, increaseMaxQuantityCustomer,
    onUpdate, onReset, onEditProduct,
  } = props;

  const showVendorDiscount = consumerType === "VENDORS" || consumerType === "EVERYONE";
  const showConsumerDiscount = consumerType === "CONSUMER" || consumerType === "EVERYONE";

  return (
    <div className="border-t border-border bg-muted p-4">
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${disableFields ? "pointer-events-none opacity-60" : ""}`}>

        {/* Base fields: stock, price, condition, delivery, consumerType, sellType, time */}
        <ManageProductBaseFields
          disableFields={disableFields}
          stock={stock} askForStock={askForStock} askForPrice={askForPrice} productPrice={productPrice}
          productCondition={productCondition} deliveryAfter={deliveryAfter}
          consumerType={consumerType} sellType={sellType}
          timeOpen={timeOpen} timeClose={timeClose}
          setStock={setStock} setProductPrice={setProductPrice}
          setCondition={setCondition} setConsumer={setConsumer} setSell={setSell}
          setDelivery={setDelivery} setTimeOpen={setTimeOpen} setTimeClose={setTimeClose}
          decreaseStock={decreaseStock} increaseStock={increaseStock}
          decreasePrice={decreasePrice} increasePrice={increasePrice}
          decreaseDeliveryDay={decreaseDeliveryDay} increaseDeliveryDay={increaseDeliveryDay}
          decreaseTimeOpen={decreaseTimeOpen} increaseTimeOpen={increaseTimeOpen}
          decreaseTimeClose={decreaseTimeClose} increaseTimeClose={increaseTimeClose}
        />

        {/* Vendor Discount - Show for VENDORS/EVERYONE consumer type */}
        {showVendorDiscount && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">{t("vendor_discount")}</Label>
            <div className="flex items-center space-x-1">
              <button onClick={(e) => { e.preventDefault(); decreaseVendorDiscount(); }}
                className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">-</button>
              <input type="number" value={vendorDiscount} onChange={(e) => setVendor(Number(e.target.value))}
                className="h-6 w-12 rounded border border-border text-center text-xs" />
              <button onClick={(e) => { e.preventDefault(); increaseVendorDiscount(); }}
                className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">+</button>
            </div>
          </div>
        )}

        {/* Vendor Discount Type */}
        {showVendorDiscount && (vendorDiscount > 0 || vendorDiscountType) && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">{t("discount_type")}</Label>
            <select value={vendorDiscountType || ""} onChange={(e) => setVendorDiscountType(e.target.value)}
              className="h-6 w-full rounded border border-border px-1 text-xs">
              <option value="FLAT" dir={langDir}>{t("flat").toUpperCase()}</option>
              <option value="PERCENTAGE" dir={langDir}>{t("percentage").toUpperCase()}</option>
            </select>
          </div>
        )}

        {/* Consumer Discount - Show for CONSUMER/EVERYONE consumer type */}
        {showConsumerDiscount && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">{t("consumer_discount")}</Label>
            <div className="flex items-center space-x-1">
              <button onClick={(e) => { e.preventDefault(); decreaseConsumerDiscount(); }}
                className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">-</button>
              <input type="number" value={consumerDiscount} onChange={(e) => setConsumerDiscount(Number(e.target.value))}
                className="h-6 w-12 rounded border border-border text-center text-xs" />
              <button onClick={(e) => { e.preventDefault(); increaseConsumerDiscount(); }}
                className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">+</button>
            </div>
          </div>
        )}

        {/* Consumer Discount Type */}
        {showConsumerDiscount && (consumerDiscount > 0 || consumerDiscountType) && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">{t("discount_type")}</Label>
            <select value={consumerDiscountType || ""} onChange={(e) => setConsumerDiscountType(e.target.value)}
              className="h-6 w-full rounded border border-border px-1 text-xs">
              <option value="FLAT" dir={langDir}>{t("flat").toUpperCase()}</option>
              <option value="PERCENTAGE" dir={langDir}>{t("percentage").toUpperCase()}</option>
            </select>
          </div>
        )}

        {/* Sell-type-specific fields (BUYGROUP, TRIAL_PRODUCT, WHOLESALE_PRODUCT) */}
        <ManageProductSellTypeFields
          sellType={sellType} consumerType={consumerType} langDir={langDir}
          vendorDiscount={vendorDiscount} vendorDiscountType={vendorDiscountType}
          consumerDiscount={consumerDiscount} consumerDiscountType={consumerDiscountType}
          minQuantity={minQuantity} maxQuantity={maxQuantity}
          minCustomer={minCustomer} maxCustomer={maxCustomer}
          minQuantityCustomer={minQuantityCustomer} maxQuantityCustomer={maxQuantityCustomer}
          setVendor={setVendor} setVendorDiscountType={setVendorDiscountType}
          setConsumerDiscount={setConsumerDiscount} setConsumerDiscountType={setConsumerDiscountType}
          setMinQuantity={setMinQuantity} setMaxQuantity={setMaxQuantity}
          setMinCustomer={setMinCustomer} setMaxCustomer={setMaxCustomer}
          setMaxQuantityCustomer={setMaxQuantityCustomer}
          decreaseVendorDiscount={decreaseVendorDiscount} increaseVendorDiscount={increaseVendorDiscount}
          decreaseConsumerDiscount={decreaseConsumerDiscount} increaseConsumerDiscount={increaseConsumerDiscount}
          decreaseMinQuantity={decreaseMinQuantity} increaseMinQuantity={increaseMinQuantity}
          decreaseMaxsQuantity={decreaseMaxsQuantity} increaseMaxQuantity={increaseMaxQuantity}
          decreaseMinCustomer={decreaseMinCustomer} increaseMinCustomer={increaseMinCustomer}
          decreaseMaxCustomer={decreaseMaxCustomer} increaseMaxCustomer={increaseMaxCustomer}
          decreaseMaxQuantityCustomer={decreaseMaxQuantityCustomer}
          increaseMaxQuantityCustomer={increaseMaxQuantityCustomer}
        />
      </div>

      {/* Action Buttons Section */}
      {!hideActionButtons && (
        <div className="mt-4 flex justify-center space-x-3 border-t border-border pt-4">
          <button type="button"
            className="flex items-center justify-center rounded-lg bg-success px-4 py-2 text-sm text-white hover:bg-success transition-colors"
            onClick={onEditProduct}>
            <IoMdEdit size={16} className="mr-1" />
            {t("edit")}
          </button>
          <button type="button"
            className="flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary transition-colors"
            onClick={(e) => onUpdate(e)}>
            <IoMdCreate size={16} className="mr-1" />
            {t("update")}
          </button>
          <button type="button"
            className="flex items-center justify-center rounded-lg bg-warning px-4 py-2 text-sm text-white hover:bg-warning transition-colors"
            onClick={onReset}>
            <IoMdRefresh size={16} className="mr-1" />
            {t("reset")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageProductExpandedFields;
