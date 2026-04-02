"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle, Clock } from "lucide-react";

type ConfirmReceiptButtonProps = {
  orderProductId: number;
  autoConfirmAt?: string | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
};

const ConfirmReceiptButton: React.FC<ConfirmReceiptButtonProps> = ({
  orderProductId,
  autoConfirmAt,
  onConfirm,
  isLoading = false,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [open, setOpen] = useState(false);

  // Calculate days remaining for auto-confirm
  const daysRemaining = autoConfirmAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(autoConfirmAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            className="w-full gap-2"
            variant="default"
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4" />
            {t("confirm_receipt")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent dir={langDir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_receipt")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm_receipt_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? t("loading") : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {daysRemaining !== null && daysRemaining > 0 && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {t("auto_confirm_in_days", { days: daysRemaining })}
        </p>
      )}
    </div>
  );
};

export default ConfirmReceiptButton;
