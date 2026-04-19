import React from "react";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type SellTypeFieldsProps = {
  sellType: string;
  consumerType: string;
  langDir: string;
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
  setVendor: (v: number) => void;
  setVendorDiscountType: (v: string) => void;
  setConsumerDiscount: (v: number) => void;
  setConsumerDiscountType: (v: string) => void;
  setMinQuantity: (v: number) => void;
  setMaxQuantity: (v: number) => void;
  setMinCustomer: (v: number) => void;
  setMaxCustomer: (v: number) => void;
  setMaxQuantityCustomer: (v: number) => void;
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
};

const CounterField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  onDecrease: (e: React.MouseEvent) => void;
  onIncrease: (e: React.MouseEvent) => void;
}> = ({ label, value, onChange, onDecrease, onIncrease }) => (
  <div className="space-y-1">
    <Label className="text-xs font-medium">{label}</Label>
    <div className="flex items-center space-x-1">
      <button
        onClick={onDecrease}
        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs"
      >
        -
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 w-12 rounded border border-border text-center text-xs"
      />
      <button
        onClick={onIncrease}
        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs"
      >
        +
      </button>
    </div>
  </div>
);

const DiscountTypeSelect: React.FC<{
  label: string;
  value: string | null;
  langDir: string;
  onChange: (v: string) => void;
  t: (key: string) => string;
}> = ({ label, value, langDir, onChange, t }) => (
  <div className="space-y-1">
    <Label className="text-xs font-medium">{label}</Label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-6 w-full rounded border border-border px-1 text-xs"
    >
      <option value="FLAT" dir={langDir}>{t("flat").toUpperCase()}</option>
      <option value="PERCENTAGE" dir={langDir}>{t("percentage").toUpperCase()}</option>
    </select>
  </div>
);

const ManageProductSellTypeFields: React.FC<SellTypeFieldsProps> = (props) => {
  const t = useTranslations();
  const {
    sellType, consumerType, langDir,
    vendorDiscount, vendorDiscountType,
    consumerDiscount, consumerDiscountType,
    minQuantity, maxQuantity, minCustomer, maxCustomer,
    minQuantityCustomer, maxQuantityCustomer,
    setVendor, setVendorDiscountType,
    setConsumerDiscount, setConsumerDiscountType,
    setMinQuantity, setMaxQuantity,
    setMinCustomer, setMaxCustomer, setMaxQuantityCustomer,
    decreaseVendorDiscount, increaseVendorDiscount,
    decreaseConsumerDiscount, increaseConsumerDiscount,
    decreaseMinQuantity, increaseMinQuantity,
    decreaseMaxsQuantity, increaseMaxQuantity,
    decreaseMinCustomer, increaseMinCustomer,
    decreaseMaxCustomer, increaseMaxCustomer,
    decreaseMaxQuantityCustomer, increaseMaxQuantityCustomer,
  } = props;

  const showVendorDiscount = consumerType === "VENDORS" || consumerType === "EVERYONE";
  const showConsumerDiscount = consumerType === "CONSUMER" || consumerType === "EVERYONE";

  return (
    <>
      {/* BUYGROUP-specific fields */}
      {sellType === "BUYGROUP" && (
        <>
          <CounterField label={t("min_quantity")} value={minQuantity} onChange={setMinQuantity}
            onDecrease={(e) => { e.preventDefault(); decreaseMinQuantity(); }}
            onIncrease={(e) => { e.preventDefault(); increaseMinQuantity(); }} />
          <CounterField label={t("max_quantity")} value={maxQuantity} onChange={setMaxQuantity}
            onDecrease={(e) => { e.preventDefault(); decreaseMaxsQuantity(); }}
            onIncrease={(e) => { e.preventDefault(); increaseMaxQuantity(); }} />
          <CounterField label={t("min_customer")} value={minCustomer} onChange={setMinCustomer}
            onDecrease={(e) => { e.preventDefault(); decreaseMinCustomer(); }}
            onIncrease={(e) => { e.preventDefault(); increaseMinCustomer(); }} />
          <CounterField label={t("max_customer")} value={maxCustomer} onChange={setMaxCustomer}
            onDecrease={(e) => { e.preventDefault(); decreaseMaxCustomer(); }}
            onIncrease={(e) => { e.preventDefault(); increaseMaxCustomer(); }} />
        </>
      )}

      {/* Min/Max Quantity Per Customer for BUYGROUP and WHOLESALE_PRODUCT */}
      {(sellType === "BUYGROUP" || sellType === "WHOLESALE_PRODUCT") && (
        <>
          <div className="space-y-1">
            <Label className="text-xs font-medium">{t("min_quantity_per_customer")}</Label>
            <input type="number" value={minQuantityCustomer} readOnly disabled
              className="h-6 w-16 rounded border border-border bg-muted text-center text-xs text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">{t("max_quantity_per_customer")}</Label>
            <input type="number" value={maxQuantityCustomer} readOnly disabled
              className="h-6 w-16 rounded border border-border bg-muted text-center text-xs text-muted-foreground" />
          </div>
        </>
      )}

      {/* TRIAL_PRODUCT-specific fields */}
      {sellType === "TRIAL_PRODUCT" && (
        <>
          {showVendorDiscount && (
            <CounterField label={t("vendor_discount")} value={vendorDiscount} onChange={setVendor}
              onDecrease={(e) => { e.preventDefault(); decreaseVendorDiscount(); }}
              onIncrease={(e) => { e.preventDefault(); increaseVendorDiscount(); }} />
          )}
          {showConsumerDiscount && (
            <CounterField label={t("consumer_discount")} value={consumerDiscount} onChange={setConsumerDiscount}
              onDecrease={(e) => { e.preventDefault(); decreaseConsumerDiscount(); }}
              onIncrease={(e) => { e.preventDefault(); increaseConsumerDiscount(); }} />
          )}
          {showVendorDiscount && (vendorDiscount > 0 || vendorDiscountType) && (
            <DiscountTypeSelect label={t("vendor_discount_type")} value={vendorDiscountType}
              langDir={langDir} onChange={setVendorDiscountType} t={t} />
          )}
          {showConsumerDiscount && (consumerDiscount > 0 || consumerDiscountType) && (
            <DiscountTypeSelect label={t("consumer_discount_type")} value={consumerDiscountType}
              langDir={langDir} onChange={setConsumerDiscountType} t={t} />
          )}
          <CounterField label={t("max_quantity_per_customer")} value={maxQuantityCustomer}
            onChange={setMaxQuantityCustomer}
            onDecrease={(e) => { e.preventDefault(); decreaseMaxQuantityCustomer(); }}
            onIncrease={(e) => { e.preventDefault(); increaseMaxQuantityCustomer(); }} />
        </>
      )}

      {/* WHOLESALE_PRODUCT-specific fields */}
      {sellType === "WHOLESALE_PRODUCT" && (
        <>
          {showVendorDiscount && (
            <CounterField label={t("vendor_discount")} value={vendorDiscount} onChange={setVendor}
              onDecrease={(e) => { e.preventDefault(); decreaseVendorDiscount(); }}
              onIncrease={(e) => { e.preventDefault(); increaseVendorDiscount(); }} />
          )}
          {showConsumerDiscount && (
            <CounterField label={t("consumer_discount")} value={consumerDiscount} onChange={setConsumerDiscount}
              onDecrease={(e) => { e.preventDefault(); decreaseConsumerDiscount(); }}
              onIncrease={(e) => { e.preventDefault(); increaseConsumerDiscount(); }} />
          )}
          {showVendorDiscount && (vendorDiscount > 0 || vendorDiscountType) && (
            <DiscountTypeSelect label={t("vendor_discount_type")} value={vendorDiscountType}
              langDir={langDir} onChange={setVendorDiscountType} t={t} />
          )}
          {showConsumerDiscount && (consumerDiscount > 0 || consumerDiscountType) && (
            <DiscountTypeSelect label={t("consumer_discount_type")} value={consumerDiscountType}
              langDir={langDir} onChange={setConsumerDiscountType} t={t} />
          )}
        </>
      )}
    </>
  );
};

export default ManageProductSellTypeFields;
