"use client";
/**
 * ItemDetailBuygroupDialog — Buygroup disclaimer/explanation modal.
 * Exact copy of the dialog from ProductCard, rendered from ItemDetailPanel.
 */
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ItemDetailBuygroupDialogProps {
  isAr: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}

export function ItemDetailBuygroupDialog({
  isAr,
  open,
  onOpenChange,
  onConfirm,
}: ItemDetailBuygroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground mb-4">
            {isAr ? "كيف تعمل مجموعات الشراء" : "How Buygroups Work"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              {isAr ? "ما هي مجموعة الشراء؟" : "What is a Buygroup?"}
            </h3>
            <p className="text-sm leading-relaxed">
              {isAr
                ? "مجموعة الشراء هي نظام شراء جماعي حيث يجتمع عدة عملاء لشراء المنتجات بأسعار أفضل. عندما تحجز منتجًا في مجموعة شراء، فأنت تحجز مكانك لهذا المنتج."
                : "A buygroup is a collective purchasing system where multiple customers come together to purchase products at better prices. When you book a product in a buygroup, you're reserving your spot for that item."}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              {isAr ? "كيف يعمل:" : "How It Works:"}
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
              <li>
                {isAr
                  ? "اختر الكمية التي تريد حجزها"
                  : "Select the quantity you want to book"}
              </li>
              <li>
                {isAr
                  ? 'اضغط "حجز" لتأكيد مكانك'
                  : 'Click "Book" to reserve your items'}
              </li>
              <li>
                {isAr
                  ? "انتظر حتى تصل المجموعة للعدد المطلوب"
                  : "Wait for the buygroup to reach the required number of participants"}
              </li>
              <li>
                {isAr
                  ? "بمجرد اكتمال المجموعة، سيتم إخطارك للدفع"
                  : "Once the buygroup is complete, you'll be notified and can proceed with payment"}
              </li>
              <li>
                {isAr
                  ? "يتم تأكيد حجزك فقط بعد وصول المجموعة لهدفها"
                  : "Your booking is confirmed only after the buygroup reaches its target"}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              {isAr ? "ملاحظات مهمة:" : "Important Notes:"}
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
              <li>
                {isAr
                  ? "حجزك هو حجز وليس شراء فوري"
                  : "Your booking is a reservation, not an immediate purchase"}
              </li>
              <li>
                {isAr
                  ? "يمكنك إلغاء حجزك قبل إغلاق المجموعة"
                  : "You can cancel your booking before the buygroup closes"}
              </li>
              <li>
                {isAr
                  ? "إذا لم تصل المجموعة لهدفها، سيتم إلغاء حجزك تلقائيًا"
                  : "If the buygroup doesn't reach its target, your booking will be automatically cancelled"}
              </li>
              <li>
                {isAr
                  ? "ستتلقى إشعارات حول حالة المجموعة"
                  : "You'll receive notifications about the buygroup status"}
              </li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded hover:bg-muted transition-colors"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors"
          >
            {isAr ? "أفهم، متابعة" : "I Understand, Proceed"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
