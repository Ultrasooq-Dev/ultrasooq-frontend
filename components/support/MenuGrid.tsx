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
  ShoppingBag,
  Settings,
  ClipboardList,
  Store,
  Truck,
  Wallet,
  Users,
  ExternalLink,
} from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  color: string;
  type: "chat" | "navigate"; // chat = opens chat flow, navigate = goes to page
  navigateTo?: string;        // URL for navigate type
}

// Quick Actions — navigate directly to pages (no chat)
const QUICK_ACTIONS: MenuItem[] = [
  {
    id: "nav_add_product",
    label: "Add New Product",
    labelAr: "إضافة منتج جديد",
    icon: PlusCircle,
    roles: ["COMPANY", "FREELANCER"],
    color: "bg-emerald-500/10 text-emerald-600",
    type: "navigate",
    navigateTo: "/product?new=true",
  },
  {
    id: "nav_manage_products",
    label: "Manage Products",
    labelAr: "إدارة المنتجات",
    icon: ShoppingBag,
    roles: ["COMPANY", "FREELANCER"],
    color: "bg-sky-500/10 text-sky-600",
    type: "navigate",
    navigateTo: "/manage-products",
  },
  {
    id: "nav_orders",
    label: "My Orders",
    labelAr: "طلباتي",
    icon: Package,
    roles: ["BUYER"],
    color: "bg-sky-500/10 text-sky-600",
    type: "navigate",
    navigateTo: "/buyer-orders",
  },
  {
    id: "nav_seller_orders",
    label: "Seller Orders",
    labelAr: "طلبات البيع",
    icon: Truck,
    roles: ["COMPANY", "FREELANCER"],
    color: "bg-teal-500/10 text-teal-600",
    type: "navigate",
    navigateTo: "/seller-orders",
  },
  {
    id: "nav_rfq",
    label: "RFQ Requests",
    labelAr: "طلبات عروض الأسعار",
    icon: ClipboardList,
    roles: ["BUYER", "COMPANY", "FREELANCER"],
    color: "bg-violet-500/10 text-violet-600",
    type: "navigate",
    navigateTo: "/rfq-request",
  },
  {
    id: "nav_analytics",
    label: "My Analytics",
    labelAr: "تحليلاتي",
    icon: BarChart3,
    roles: ["COMPANY", "FREELANCER"],
    color: "bg-indigo-500/10 text-indigo-600",
    type: "navigate",
    navigateTo: "/analytics",
  },
  {
    id: "nav_wallet",
    label: "Wallet",
    labelAr: "المحفظة",
    icon: Wallet,
    roles: ["BUYER", "COMPANY", "FREELANCER"],
    color: "bg-amber-500/10 text-amber-600",
    type: "navigate",
    navigateTo: "/wallet",
  },
  {
    id: "nav_messages",
    label: "Messages",
    labelAr: "الرسائل",
    icon: MessageSquare,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-orange-500/10 text-orange-600",
    type: "navigate",
    navigateTo: "/vendor-dashboard",
  },
  {
    id: "nav_team",
    label: "Team Members",
    labelAr: "أعضاء الفريق",
    icon: Users,
    roles: ["COMPANY", "FREELANCER"],
    color: "bg-cyan-500/10 text-cyan-600",
    type: "navigate",
    navigateTo: "/team-members",
  },
  {
    id: "nav_store",
    label: "My Store",
    labelAr: "متجري",
    icon: Store,
    roles: ["COMPANY", "FREELANCER"],
    color: "bg-rose-500/10 text-rose-600",
    type: "navigate",
    navigateTo: "/external-stores",
  },
];

// Chat Support — opens chat flow inside widget
const CHAT_ITEMS: MenuItem[] = [
  {
    id: "product_search",
    label: "Search Products",
    labelAr: "البحث عن المنتجات",
    icon: Search,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-blue-500/10 text-blue-600",
    type: "chat",
  },
  {
    id: "order_tracker",
    label: "Track Orders",
    labelAr: "تتبع الطلبات",
    icon: Package,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-green-500/10 text-green-600",
    type: "chat",
  },
  {
    id: "faq",
    label: "FAQ & Help",
    labelAr: "الأسئلة الشائعة",
    icon: HelpCircle,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-yellow-500/10 text-yellow-600",
    type: "chat",
  },
  {
    id: "escalate",
    label: "Talk to Admin",
    labelAr: "تحدث مع الدعم",
    icon: Headset,
    roles: ["BUYER", "COMPANY", "FREELANCER", "MEMBER"],
    color: "bg-red-500/10 text-red-600",
    type: "chat",
  },
];

interface MenuGridProps {
  tradeRole: string;
  locale: string;
  onMenuClick: (menuId: string) => void;
  onNavigate: (url: string) => void;
}

export default function MenuGrid({ tradeRole, locale, onMenuClick, onNavigate }: MenuGridProps) {
  const role = tradeRole || "BUYER";
  const visibleQuickActions = QUICK_ACTIONS.filter((item) => item.roles.includes(role));
  const visibleChatItems = CHAT_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="space-y-3 p-3">
      {/* Quick Actions — navigate to pages */}
      {visibleQuickActions.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5 px-1">
            {locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {visibleQuickActions.map((item) => {
              const Icon = item.icon;
              const label = locale === "ar" ? item.labelAr : item.label;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.navigateTo!)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] ${item.color} border border-transparent hover:border-border`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-medium leading-tight text-center line-clamp-2">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Support — opens chat flow */}
      <div>
        <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5 px-1">
          {locale === "ar" ? "الدعم والمساعدة" : "Support & Help"}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {visibleChatItems.map((item) => {
            const Icon = item.icon;
            const label = locale === "ar" ? item.labelAr : item.label;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onMenuClick(item.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl p-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${item.color} border border-transparent hover:border-border`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium leading-tight text-center">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
