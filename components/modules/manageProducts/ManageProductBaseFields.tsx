import React from "react";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

type ManageProductBaseFieldsProps = {
  disableFields?: boolean;
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
  setStock: (v: number) => void;
  setProductPrice: (v: number) => void;
  setCondition: (v: string) => void;
  setConsumer: (v: string) => void;
  setSell: (v: string) => void;
  setDelivery: (v: number) => void;
  setTimeOpen: (v: number) => void;
  setTimeClose: (v: number) => void;
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
};

const ManageProductBaseFields: React.FC<ManageProductBaseFieldsProps> = ({
  disableFields,
  stock, askForStock, askForPrice, productPrice,
  productCondition, deliveryAfter, consumerType, sellType,
  timeOpen, timeClose,
  setStock, setProductPrice, setCondition, setConsumer, setSell,
  setDelivery, setTimeOpen, setTimeClose,
  decreaseStock, increaseStock, decreasePrice, increasePrice,
  decreaseDeliveryDay, increaseDeliveryDay,
  decreaseTimeOpen, increaseTimeOpen, decreaseTimeClose, increaseTimeClose,
}) => {
  const t = useTranslations();

  return (
    <>
      {/* Stock Management */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">{t("stock")}</Label>
        <div className="flex items-center space-x-1">
          <input type="checkbox" className="h-3 w-3"
            defaultChecked={askForStock === "false" || askForStock === "NO" || (askForStock as any) === false}
            disabled={disableFields} />
          <span className="text-xs text-muted-foreground">{t("manage_stock")}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button type="button" onClick={decreaseStock}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">-</button>
          <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))}
            disabled={disableFields} className="h-6 w-12 rounded border border-border text-center text-xs" />
          <button type="button" onClick={increaseStock}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">+</button>
        </div>
      </div>

      {/* Price Management */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">{t("price")}</Label>
        <div className="flex items-center space-x-1">
          <input type="checkbox" className="h-3 w-3"
            defaultChecked={askForPrice === "false" || askForPrice === "NO" || (askForPrice as any) === false} />
          <span className="text-xs text-muted-foreground">{t("manage_price")}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button type="button" onClick={(e) => { e.preventDefault(); decreasePrice(); }}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">-</button>
          <input type="number" value={productPrice} onChange={(e) => setProductPrice(Number(e.target.value))}
            className="h-6 w-14 rounded border border-border text-center text-xs" />
          <button type="button" onClick={(e) => { e.preventDefault(); increasePrice(); }}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">+</button>
        </div>
      </div>

      {/* Product Condition */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">{t("product_condition")}</Label>
        <select value={productCondition} onChange={(e) => setCondition(e.target.value)}
          className="h-6 w-full rounded border border-border px-1 text-xs">
          <option value="NEW">{t("new")}</option>
          <option value="OLD">{t("old")}</option>
          <option value="REFURBISHED">{t("refurbished")}</option>
        </select>
      </div>

      {/* Delivery After */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">{t("deliver_after")}</Label>
        <div className="flex items-center space-x-1">
          <button onClick={(e) => { e.preventDefault(); decreaseDeliveryDay(); }}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">-</button>
          <input type="number" value={deliveryAfter} onChange={(e) => setDelivery(Number(e.target.value))}
            className="h-6 w-12 rounded border border-border text-center text-xs" />
          <button onClick={(e) => { e.preventDefault(); increaseDeliveryDay(); }}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">+</button>
        </div>
      </div>

      {/* Consumer Type */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">{t("consumer_type")}</Label>
        <select value={consumerType} onChange={(e) => setConsumer(e.target.value)} disabled={false}
          className="h-6 w-full rounded border border-border px-1 text-xs">
          <option value="CONSUMER">{t("consumer")}</option>
          <option value="VENDORS">{t("vendor")}</option>
          <option value="EVERYONE">{t("everyone")}</option>
        </select>
      </div>

      {/* Sell Type */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">{t("sell_type")}</Label>
        <select value={sellType} onChange={(e) => setSell(e.target.value)}
          className="h-6 w-full rounded border border-border px-1 text-xs">
          <option value="NORMALSELL">{t("normal_sell")}</option>
          <option value="BUYGROUP">{t("buy_group")}</option>
          <option value="TRIAL_PRODUCT">{t("trial_product")}</option>
          <option value="WHOLESALE_PRODUCT">{t("wholesale_product")}</option>
        </select>
      </div>

      {/* Time Open */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">{t("time_open")}</Label>
        <div className="flex items-center space-x-1">
          <button onClick={(e) => { e.preventDefault(); decreaseTimeOpen(); }}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">-</button>
          <input type="number" value={timeOpen} onChange={(e) => setTimeOpen(Number(e.target.value))}
            className="h-6 w-12 rounded border border-border text-center text-xs" />
          <button onClick={(e) => { e.preventDefault(); increaseTimeOpen(); }}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">+</button>
        </div>
      </div>

      {/* Time Close */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">{t("time_close")}</Label>
        <div className="flex items-center space-x-1">
          <button onClick={(e) => { e.preventDefault(); decreaseTimeClose(); }}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">-</button>
          <input type="number" value={timeClose} onChange={(e) => setTimeClose(Number(e.target.value))}
            className="h-6 w-12 rounded border border-border text-center text-xs" />
          <button onClick={(e) => { e.preventDefault(); increaseTimeClose(); }}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted text-xs">+</button>
        </div>
      </div>
    </>
  );
};

export default ManageProductBaseFields;
