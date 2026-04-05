import React from "react";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type ConfirmContentProps = {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  description: string;
};

const ConfirmContent: React.FC<ConfirmContentProps> = ({
  onClose,
  onConfirm,
  isLoading,
  description,
}) => {
  return (
    <DialogContent className="custom-ui-alert-popup danger-alert-popup">
      <DialogHeader className="alert-popup-headerpart">
        <h1>Confirm</h1>
      </DialogHeader>
      <DialogDescription className="alert-popup-bodypart">
        {`Are you sure you want to ${description}?`}
      </DialogDescription>
      <DialogFooter className="alert-actions">
        <div className="alert-actions-col">
          <Button
            onClick={onClose}
            disabled={isLoading}
            className="alert--cancel-btn"
          >
            No
          </Button>
        </div>
        <div className="alert-actions-col">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="alert--submit-btn"
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
                Please wait
              </>
            ) : (
              "Yes"
            )}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export default ConfirmContent;
