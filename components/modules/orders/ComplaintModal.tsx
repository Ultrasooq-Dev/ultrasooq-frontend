"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useSubmitComplaint } from "@/apis/queries/orders.queries";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { COMPLAINT_TYPES } from "./constants";
import type { ComplaintModalProps } from "./types";

export default function ComplaintModal({
  open,
  onOpenChange,
  orderProductId,
  orderNo,
  productName,
  onSuccess,
}: ComplaintModalProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const submitComplaint = useSubmitComplaint();
  const [complainType, setComplainType] = useState("");
  const [complainText, setComplainText] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    setComplainType("");
    setComplainText("");
  };

  const handleSubmit = () => {
    submitComplaint.mutate(
      { orderProductId, reason: complainType, description: complainText },
      {
        onSuccess: (data) => {
          if (data?.status) {
            toast({
              title: t("complaint_submitted") || "Complaint submitted",
              description: t("complaint_review_notice") || "We'll review it shortly",
              variant: "success",
            });
            handleClose();
            onSuccess?.();
          } else {
            toast({
              title: t("failed") || "Failed",
              description: data?.message || t("complaint_submit_failed") || "Could not submit complaint",
              variant: "danger",
            });
          }
        },
        onError: () =>
          toast({
            title: t("error") || "Error",
            description: t("complaint_submit_failed") || "Failed to submit complaint",
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
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t("file_complaint") || "File a Complaint"}
          </DialogTitle>
          <DialogDescription>
            #{orderNo} — {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {COMPLAINT_TYPES.map((ct) => (
              <button
                key={ct.key}
                type="button"
                onClick={() => setComplainType(ct.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium transition-colors",
                  complainType === ct.key
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                    : "border-border hover:bg-muted",
                )}
              >
                {ct.icon} {t(ct.label) || ct.key}
              </button>
            ))}
          </div>
          <textarea
            value={complainText}
            onChange={(e) => setComplainText(e.target.value)}
            rows={3}
            placeholder={t("describe_issue") || "Describe the issue..."}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("cancel") || "Cancel"}
          </Button>
          <Button
            disabled={!complainType || !complainText.trim() || submitComplaint.isPending}
            onClick={handleSubmit}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            {submitComplaint.isPending ? (
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
