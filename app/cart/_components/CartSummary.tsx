"use client";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface CartSummaryProps {
  langDir: string;
  currency: { symbol: string };
  totalAmount: number;
  itemCount: number;
}

const CartSummary = ({
  langDir,
  currency,
  totalAmount,
  itemCount,
}: CartSummaryProps) => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="sticky top-6 rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted px-4 py-3">
        <h2
          className="text-lg font-semibold text-foreground"
          dir={langDir}
          translate="no"
        >
          {t("order_summary") || "Order Summary"}
        </h2>
      </div>

      <div className="p-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground" dir={langDir} translate="no">
              {t("subtotal")} ({itemCount}{" "}
              {itemCount === 1 ? t("item") : t("items")})
            </span>
            <span className="font-medium text-foreground">
              {currency.symbol}
              {totalAmount}
            </span>
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span
                className="text-base font-semibold text-foreground"
                dir={langDir}
                translate="no"
              >
                {t("total_amount")}
              </span>
              <span className="text-lg font-bold text-foreground">
                {currency.symbol}
                {totalAmount}
              </span>
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <div className="mt-4 space-y-2">
          <Button
            onClick={() => router.push("/checkout")}
            disabled={itemCount === 0}
            className="w-full rounded-md bg-warning px-4 py-2.5 font-medium text-foreground shadow-sm transition-colors hover:bg-warning disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            dir={langDir}
            translate="no"
          >
            {t("proceed_to_checkout") || "Proceed to checkout"}
          </Button>

          {itemCount > 0 && (
            <Button
              onClick={() => router.push("/trending")}
              variant="outline"
              className="w-full border-border text-sm text-muted-foreground hover:bg-muted"
            >
              {t("continue_shopping") || "Continue Shopping"}
            </Button>
          )}
        </div>

        {/* Security Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span translate="no">{t("secure_checkout")}</span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
