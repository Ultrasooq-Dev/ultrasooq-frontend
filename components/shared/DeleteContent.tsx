import React from "react";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type DeleteContentProps = {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
};

const DeleteContent: React.FC<DeleteContentProps> = ({
  onClose,
  onConfirm,
  isLoading,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <DialogContent className="custom-ui-alert-popup danger-alert-popup">
      <DialogHeader className="alert-popup-headerpart">
        <h1 dir={langDir} translate="no">{t("delete")}</h1>
      </DialogHeader>
      <DialogDescription className="alert-popup-bodypart">
        <h4 dir={langDir} translate="no">{t("confirm_delete")}</h4>
      </DialogDescription>
      <DialogFooter className="alert-actions">
        <div className="alert-actions-col">
          <Button
            onClick={onClose}
            disabled={isLoading}
            className="alert--cancel-btn"
            dir={langDir}
            translate="no"
          >
            {t("no")}
          </Button>
        </div>
        <div className="alert-actions-col">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="alert--submit-btn"
            dir={langDir}
            translate="no"
          >
            {isLoading ? (
              <>
                <Image
                  src="/images/load.png"
                  alt="loader-icon"
                  width={20}
                  height={20}
                  className="mr-2 animate-spin"
                />
                {t("please_wait")}
              </>
            ) : (
              t("yes")
            )}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export default DeleteContent;
