"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRequestRefund } from "@/apis/queries/orders.queries";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ReceiptText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { REFUND_REASONS } from "./constants";
import type { RefundModalProps } from "./types";

export default function RefundModal({
  open,
  onOpenChange,
  orderProductId,
  orderNo,
  amount,
  currencySymbol,
  onSuccess,
}: RefundModalProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const requestRefund = useRequestRefund();
  const [refundReason, setRefundReason] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    setRefundReason("");
  };

  const handleSubmit = () => {
    requestRefund.mutate(
      { orderProductId, reason: refundReason, amount },
      {
        onSuccess: (data) => {
          if (data?.status) {
            toast({
              title: t("refund_requested") || "Refund requested",
              description: t("refund_review_notice") || "We'll review within 24-48 hours",
              variant: "success",
            });
            handleClose();
            onSuccess?.();
          } else {
            toast({
              title: t("failed") || "Failed",
              description: data?.message || t("refund_submit_failed") || "Could not submit refund",
              variant: "danger",
            });
          }
        },
        onError: () =>
          toast({
            title: t("error") || "Error",
            description: t("refund_submit_failed") || "Failed to submit refund request",
            variant: "danger",
          }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-red-500" />
            {t("refund") || "Request Refund"}
          </DialogTitle>
          {orderNo && (
            <DialogDescription>#{orderNo}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {/* Refund amount */}
          <div className="flex justify-between rounded-lg bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">
              {t("refund_amount") || "Refund amount"}
            </span>
            <span className="font-bold text-primary">
              {currencySymbol}{amount.toFixed(2)}
            </span>
          </div>

          {/* Reason selection */}
          {REFUND_REASONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRefundReason(r.key)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-xs text-start transition-colors",
                refundReason === r.key
                  ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                  : "border-border hover:bg-muted",
              )}
            >
              <div
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full border-2",
                  refundReason === r.key
                    ? "border-red-500 bg-red-500"
                    : "border-muted-foreground/30",
                )}
              />
              {t(r.label) || r.key}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("cancel") || "Cancel"}
          </Button>
          <Button
            disabled={!refundReason || requestRefund.isPending}
            onClick={handleSubmit}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {requestRefund.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              t("submit") || "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
