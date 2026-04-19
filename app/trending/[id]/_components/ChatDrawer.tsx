"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { IoCloseSharp } from "react-icons/io5";

const ProductChat = dynamic(
  () => import("@/components/modules/chat/productChat/ProductChat"),
  {
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
    ssr: false,
  },
);

interface ChatDrawerProps {
  productDetails: any;
  meDataId: number | undefined;
  searchParamsId: string;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

export default function ChatDrawer({
  productDetails,
  meDataId,
  searchParamsId,
  isChatOpen,
  setIsChatOpen,
}: ChatDrawerProps) {
  const t = useTranslations();
  const { langDir } = useAuth();

  const adminId = productDetails?.product_productPrice?.[0]?.adminDetail?.id;
  if (!productDetails || !adminId || meDataId === adminId) return null;

  return (
    <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
      <DrawerContent className="flex h-[90vh] max-h-[90vh] flex-col">
        <DrawerHeader className="flex-shrink-0 border-b border-border px-4 py-3">
          <DrawerTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg font-semibold" dir={langDir} translate="no">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {t("chat_with_seller") || "Chat with Seller"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(false)}
              className="h-8 w-8 rounded-full p-0"
            >
              <IoCloseSharp size={18} />
            </Button>
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ProductChat productId={Number(searchParamsId)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
