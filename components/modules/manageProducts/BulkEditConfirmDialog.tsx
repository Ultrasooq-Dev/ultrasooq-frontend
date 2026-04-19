"use client";
import React from "react";
import { ConfirmAction } from "./bulkEditTypes";

interface BulkEditConfirmDialogProps {
  confirmAction: ConfirmAction;
  onCancel: () => void;
}

const BulkEditConfirmDialog: React.FC<BulkEditConfirmDialogProps> = ({
  confirmAction,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded shadow-xl max-w-sm w-full mx-4">
        <div className="p-4">
          <div className="flex items-center mb-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                confirmAction.type === "hide"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-success/10 text-success"
              }`}
            >
              {confirmAction.type === "hide" ? "⚠️" : "✅"}
            </div>
            <h3 className="text-base font-medium text-foreground">
              Confirm Action
            </h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {confirmAction.message}
          </p>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-muted-foreground border border-border rounded hover:bg-muted focus:outline-hidden focus:ring-1 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAction.onConfirm}
              className={`px-3 py-1.5 text-xs text-white rounded focus:outline-hidden focus:ring-1 transition-colors ${
                confirmAction.type === "hide"
                  ? "bg-destructive hover:bg-destructive/90 focus:ring-destructive"
                  : "bg-success hover:bg-success/90 focus:ring-success"
              }`}
            >
              {confirmAction.type === "hide" ? "Hide Products" : "Show Products"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEditConfirmDialog;
