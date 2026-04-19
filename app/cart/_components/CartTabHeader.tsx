"use client";
import { ShoppingBag, FileSearch } from "lucide-react";
import { useTranslations } from "next-intl";

interface CartTabHeaderProps {
  langDir: string;
  activeCartTab: "order" | "rfq";
  setActiveCartTab: (tab: "order" | "rfq") => void;
  cartItemCount: number;
}

const CartTabHeader = ({
  langDir,
  activeCartTab,
  setActiveCartTab,
  cartItemCount,
}: CartTabHeaderProps) => {
  const t = useTranslations();

  return (
    <div className="mb-6 border-b border-border pb-0">
      <h1
        className="text-3xl font-semibold text-foreground mb-4"
        dir={langDir}
        translate="no"
      >
        {t("my_cart")}
      </h1>
      {/* Cart Type Tabs */}
      <div className="flex gap-0">
        <button
          onClick={() => setActiveCartTab("order")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeCartTab === "order"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          {t("order_cart") || "Order Cart"}
          {cartItemCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {cartItemCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveCartTab("rfq")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeCartTab === "rfq"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSearch className="h-4 w-4" />
          {t("rfq_cart") || "RFQ Cart"}
        </button>
      </div>
    </div>
  );
};

export default CartTabHeader;
