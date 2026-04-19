"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import type { OrderProductDetail } from "./types";

interface OtherOrderItemsProps {
  items: OrderProductDetail[];
  currentItemId: number;
}

export default function OtherOrderItems({
  items,
  currentItemId,
}: OtherOrderItemsProps) {
  const t = useTranslations();
  const { currency } = useAuth();
  const filteredItems = items.filter((item) => item.id !== currentItemId);

  if (filteredItems.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-bold">
        {t("other_items_in_order")}
      </h3>
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const p =
            item.orderProduct_productPrice?.productPrice_product ||
            item.orderProduct_product;
          const img = p?.productImages?.[0]?.image;
          return (
            <Link
              key={item.id}
              href={`/orders/${item.id}`}
              className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={img || PlaceholderImage}
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p?.productName || `Item #${item.id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.orderQuantity || 1}
                </p>
              </div>
              <span className="text-sm font-semibold">
                {currency.symbol}
                {Number(item.customerPay || item.purchasePrice || 0).toFixed(2)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
