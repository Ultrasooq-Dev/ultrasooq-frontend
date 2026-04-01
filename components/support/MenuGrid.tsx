"use client";
import React from "react";
import {
  Search,
  Package,
  FileText,
  MessageSquare,
  PlusCircle,
  BarChart3,
  HelpCircle,
  Headset,
} from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[]; // which tradeRoles see this item
  color: string;   // tailwind bg class
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "product_search",
    label: "Search Products",
    labelAr: "البحث عن المنتجات",
    icon: Search,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "order_tracker",
    label: "Track Orders",
    labelAr: "تتبع الطلبات",
    icon: Package,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-green-500/10 text-green-600",
  },
  {
    id: "rfq_help",
    label: "Create RFQ",
    labelAr: "إنشاء طلب عرض أسعار",
    icon: FileText,
    roles: ["BUYER"],
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "messages",
    label: "Messages",
    labelAr: "الرسائل",
    icon: MessageSquare,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "add_product",
    label: "Add Product",
    labelAr: "إضافة منتج",
    icon: PlusCircle,
    roles: ["COMPANY", "FREELANCER"],
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    id: "my_analytics",
    label: "My Analytics",
    labelAr: "تحليلاتي",
    icon: BarChart3,
    roles: ["COMPANY", "FREELANCER"],
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    id: "faq",
    label: "FAQ & Help",
    labelAr: "الأسئلة الشائعة",
    icon: HelpCircle,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-yellow-500/10 text-yellow-600",
  },
  {
    id: "escalate",
    label: "Talk to Admin",
    labelAr: "تحدث مع الدعم",
    icon: Headset,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-red-500/10 text-red-600",
  },
];

interface MenuGridProps {
  tradeRole: string;
  locale: string;
  onMenuClick: (menuId: string) => void;
}

export default function MenuGrid({ tradeRole, locale, onMenuClick }: MenuGridProps) {
  const visibleItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(tradeRole || "BUYER")
  );

  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const label = locale === "ar" ? item.labelAr : item.label;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onMenuClick(item.id)}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${item.color} border border-transparent hover:border-border`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium leading-tight text-center">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
