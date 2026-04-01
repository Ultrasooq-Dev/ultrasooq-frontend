import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Store,
  Users,
  Package,
  CreditCard,
  UserCheck,
  MessageSquare,
  Star,
  AlertTriangle,
  FileText,
  ShoppingBag,
  Wrench,
  ShoppingCart,
  Truck,
  RotateCcw,
  Scale,
  Wallet,
  Receipt,
  HelpCircle,
  MessagesSquare,
  StickyNote,
  Bell,
} from "lucide-react";

type OperationsProps = {
  onSelect: (operation: string) => void;
  unreadCounts?: Record<string, number>;
};

type CategoryItem = {
  key: string;
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
};

type CategoryGroup = {
  key: string;
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: CategoryItem[];
};

const CATEGORIES: CategoryGroup[] = [
  {
    key: "unread",
    label: "Unread Messages",
    labelAr: "رسائل غير مقروءة",
    icon: Bell,
    color: "text-red-500",
    items: [],
  },
  {
    key: "admin_support",
    label: "Admin & Support",
    labelAr: "الدعم والإدارة",
    icon: Shield,
    color: "text-green-600",
    items: [
      { key: "bot_support", label: "Bot Support", labelAr: "دعم المساعد", icon: MessageSquare },
      { key: "admin_support_chat", label: "Admin Support", labelAr: "دعم الإدارة", icon: Shield },
      { key: "system_notifications", label: "Notifications", labelAr: "الإشعارات", icon: Bell },
    ],
  },
  {
    key: "vendor_operations",
    label: "Vendor Operations",
    labelAr: "عمليات البائع",
    icon: Store,
    color: "text-orange-600",
    items: [
      { key: "questions_n_comments", label: "Questions & Comments", labelAr: "أسئلة وتعليقات", icon: MessagesSquare },
      { key: "rate_n_review", label: "Rate & Review", labelAr: "التقييمات", icon: Star },
      { key: "complains", label: "Complaints", labelAr: "الشكاوى", icon: AlertTriangle },
      { key: "rfq", label: "RFQ", labelAr: "طلبات عروض الأسعار", icon: FileText },
      { key: "product", label: "Product", labelAr: "المنتجات", icon: ShoppingBag },
      { key: "service", label: "Service", labelAr: "الخدمات", icon: Wrench },
      { key: "buygroup", label: "Buy Group", labelAr: "مجموعات الشراء", icon: ShoppingCart },
    ],
  },
  {
    key: "customer_operations",
    label: "Customer Operations",
    labelAr: "عمليات العملاء",
    icon: UserCheck,
    color: "text-blue-600",
    items: [
      { key: "cust_questions", label: "Questions & Comments", labelAr: "أسئلة وتعليقات", icon: MessagesSquare },
      { key: "cust_reviews", label: "Rate & Review", labelAr: "التقييمات", icon: Star },
      { key: "cust_complains", label: "Complaints", labelAr: "الشكاوى", icon: AlertTriangle },
      { key: "cust_rfq", label: "RFQ", labelAr: "طلبات الأسعار", icon: FileText },
      { key: "cust_product", label: "Product", labelAr: "المنتجات", icon: ShoppingBag },
      { key: "cust_service", label: "Service", labelAr: "الخدمات", icon: Wrench },
      { key: "cust_buygroup", label: "Buy Group", labelAr: "مجموعات الشراء", icon: ShoppingCart },
    ],
  },
  {
    key: "order_operations",
    label: "Order Operations",
    labelAr: "عمليات الطلبات",
    icon: Package,
    color: "text-purple-600",
    items: [
      { key: "pre_order", label: "Pre-Order Questions", labelAr: "أسئلة ما قبل الطلب", icon: HelpCircle },
      { key: "order_updates", label: "Order Updates", labelAr: "تحديثات الطلبات", icon: Package },
      { key: "shipping", label: "Shipping & Delivery", labelAr: "الشحن والتوصيل", icon: Truck },
      { key: "returns", label: "Returns & Refunds", labelAr: "الإرجاع والاسترداد", icon: RotateCcw },
      { key: "disputes", label: "Disputes", labelAr: "النزاعات", icon: Scale },
    ],
  },
  {
    key: "payment_wallet",
    label: "Payment & Wallet",
    labelAr: "الدفع والمحفظة",
    icon: CreditCard,
    color: "text-emerald-600",
    items: [
      { key: "payment_issues", label: "Payment Issues", labelAr: "مشاكل الدفع", icon: CreditCard },
      { key: "wallet_transactions", label: "Wallet", labelAr: "المحفظة", icon: Wallet },
      { key: "invoice_questions", label: "Invoices", labelAr: "الفواتير", icon: Receipt },
    ],
  },
  {
    key: "team",
    label: "Team",
    labelAr: "الفريق",
    icon: Users,
    color: "text-cyan-600",
    items: [
      { key: "team_chat", label: "Team Chat", labelAr: "محادثة الفريق", icon: MessagesSquare },
      { key: "internal_notes", label: "Internal Notes", labelAr: "ملاحظات داخلية", icon: StickyNote },
    ],
  },
];

const COLLAPSED_KEY = "us_ops_collapsed";
function getStoredCollapsed(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "{}"); } catch { return {}; }
}

const Operations: React.FC<OperationsProps> = ({ onSelect, unreadCounts = {} }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const isAr = langDir === "rtl";

  const [selectedOp, setSelectedOp] = useState<string>("questions_n_comments");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => getStoredCollapsed());

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const selectOp = (key: string) => {
    setSelectedOp(key);
    onSelect(key);
  };

  const getGroupUnread = (group: CategoryGroup): number => {
    if (group.key === "unread") return Object.values(unreadCounts).reduce((s, n) => s + n, 0);
    return group.items.reduce((s, item) => s + (unreadCounts[item.key] ?? 0), 0);
  };

  return (
    <div className="w-full border-e border-solid border-border lg:w-[15%] flex flex-col">
      {/* Header */}
      <div
        className="flex min-h-[55px] w-full items-center border-b border-solid border-border px-3 py-2.5 text-sm font-semibold text-foreground"
        dir={langDir}
      >
        <MessageSquare className="h-4 w-4 me-2 text-primary" />
        <span>{isAr ? "الرسائل" : "Messages"}</span>
      </div>

      {/* Category Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {CATEGORIES.map((group) => {
          const isCollapsed = collapsed[group.key] ?? false;
          const groupUnread = getGroupUnread(group);
          const GroupIcon = group.icon;
          const isUnreadCategory = group.key === "unread";

          return (
            <div key={group.key} className="border-b border-border/50 last:border-0">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => {
                  if (isUnreadCategory || group.items.length === 0) {
                    selectOp(group.key);
                  } else {
                    toggleGroup(group.key);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-start transition-colors",
                  isUnreadCategory && groupUnread > 0 ? "bg-destructive/5" : "hover:bg-muted/50",
                  selectedOp === group.key ? "bg-primary/10" : "",
                )}
              >
                {!isUnreadCategory && group.items.length > 0 && (
                  isCollapsed
                    ? <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <GroupIcon className={cn("h-4 w-4 shrink-0", group.color)} />
                <span className="flex-1 text-xs font-medium truncate">
                  {isAr ? group.labelAr : group.label}
                </span>
                {groupUnread > 0 && (
                  <span className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold px-1 shrink-0",
                    isUnreadCategory ? "bg-destructive text-white" : "bg-muted text-muted-foreground",
                  )}>
                    {groupUnread}
                  </span>
                )}
              </button>

              {/* Sub-items */}
              {!isCollapsed && !isUnreadCategory && group.items.length > 0 && (
                <div className="pb-1">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const itemUnread = unreadCounts[item.key] ?? 0;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => selectOp(item.key)}
                        className={cn(
                          "flex w-full items-center gap-2 ps-8 pe-3 py-1.5 text-start transition-colors",
                          selectedOp === item.key
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                        )}
                      >
                        <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1 text-[11px] truncate">
                          {isAr ? item.labelAr : item.label}
                        </span>
                        {itemUnread > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-0.5 shrink-0">
                            {itemUnread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Operations;
