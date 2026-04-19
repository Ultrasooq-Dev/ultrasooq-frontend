"use client";
import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface ConfirmRemoveDialogProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDialogRef: React.RefObject<any>;
}

const ConfirmRemoveDialog: React.FC<ConfirmRemoveDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  confirmDialogRef,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md"
        ref={confirmDialogRef}
      >
        <div
          className="flex items-center justify-between border-b border-border px-6 py-4"
          dir={langDir}
        >
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <svg
              className="h-5 w-5 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span translate="no">{t("confirm_removal")}</span>
          </DialogTitle>
          <Button
            onClick={onCancel}
            className="h-8 w-8 rounded-full bg-muted p-0 text-muted-foreground shadow-none hover:bg-muted"
          >
            <IoCloseSharp size={18} />
          </Button>
        </div>

        <div className="px-6 py-6">
          <p
            className="mb-6 text-center text-muted-foreground"
            dir={langDir}
            translate="no"
          >
            {t("confirm_remove_item_message")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              onClick={onCancel}
              className="min-w-[120px] rounded-lg border-2 border-border bg-card px-6 py-2.5 font-medium text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted"
              dir={langDir}
              translate="no"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              className="min-w-[120px] rounded-lg bg-gradient-to-r from-destructive to-destructive/90 px-6 py-2.5 font-medium text-white shadow-md transition-all hover:from-destructive hover:to-destructive/80 hover:shadow-lg active:scale-95"
              dir={langDir}
              translate="no"
            >
              {t("remove")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmRemoveDialog;
