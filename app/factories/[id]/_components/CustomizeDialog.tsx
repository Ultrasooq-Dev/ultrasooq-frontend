"use client";
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";

const AddToCustomizeForm = dynamic(
  () => import("@/components/modules/factories/AddToCustomizeForm"),
  {
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
    ssr: false,
  },
);

interface CustomizeDialogProps {
  isOpen: boolean;
  onOpenChange: () => void;
  selectedProductId: number;
}

const CustomizeDialog: React.FC<CustomizeDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedProductId,
}) => {
  const queryClient = useQueryClient();

  const handleAddToCart = () => {
    queryClient.invalidateQueries({ queryKey: ["product-by-id"] });
    queryClient.invalidateQueries({ queryKey: ["factories-cart-by-user"] });
    queryClient.invalidateQueries({ queryKey: ["factoriesProducts"] });
    onOpenChange();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-2xl p-0">
        <AddToCustomizeForm
          selectedProductId={selectedProductId}
          onClose={onOpenChange}
          onAddToCart={handleAddToCart}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CustomizeDialog;
