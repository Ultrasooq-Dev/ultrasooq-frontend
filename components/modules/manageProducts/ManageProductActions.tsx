import React from "react";
import Link from "next/link";
import { IoMdStats, IoMdCopy, IoMdTrash, IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type ManageProductActionsProps = {
  id: number;
  productId: number;
  isExpanded: boolean;
  hideCopyButton?: boolean;
  hideActionButtons?: boolean;
  onRemove: () => void;
  onToggleExpand: () => void;
};

const ManageProductActions: React.FC<ManageProductActionsProps> = ({
  id,
  productId,
  isExpanded,
  hideCopyButton,
  hideActionButtons,
  onRemove,
  onToggleExpand,
}) => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="flex items-center space-x-2">
      {/* Analytics Button */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        onClick={() => router.push(`/analytics/${id}`)}
        title={t("analytics") || "Analytics"}
      >
        <IoMdStats size={18} />
      </button>

      {/* Action Buttons - Iconic Only */}
      {!hideCopyButton && !hideActionButtons && (
        <div className="flex space-x-2">
          {!hideCopyButton && (
            <Link href={`/product?copy=${productId}`}>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-success text-white hover:bg-success transition-colors"
                title={t("copy_product")}
              >
                <IoMdCopy size={18} />
              </button>
            </Link>
          )}

          {!hideActionButtons && (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive text-white hover:bg-destructive transition-colors"
              onClick={onRemove}
              title={t("remove")}
            >
              <IoMdTrash size={18} />
            </button>
          )}
        </div>
      )}

      {/* Expand/Collapse Button */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        onClick={onToggleExpand}
        title={isExpanded ? t("collapse") : t("expand")}
      >
        {isExpanded ? <IoMdArrowUp size={18} /> : <IoMdArrowDown size={18} />}
      </button>
    </div>
  );
};

export default ManageProductActions;
