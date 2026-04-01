import React, { useState } from "react";
import Products from "@/components/modules/vendorOperations/Products";
import Operations from "@/components/modules/vendorOperations/Operations";
import QuestionAndAnswers from "./QuestionAndComments";
import ServiceQuestionAndAnswers from "./ServiceQuestionAndComments";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  MessageSquare,
  Construction,
  Bell,
  Shield,
  Star,
  AlertTriangle,
  FileText,
  ShoppingBag,
  Wrench,
  ShoppingCart,
  Package,
  Truck,
  RotateCcw,
  Scale,
  CreditCard,
  Wallet,
  Receipt,
  Users,
  StickyNote,
  HelpCircle,
} from "lucide-react";

// Placeholder for categories not yet implemented
function ComingSoon({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="w-full border-e border-solid border-border lg:w-[67%] flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Icon className="h-12 w-12 mb-3 opacity-20" />
      <h3 className="text-sm font-medium text-foreground/60">{title}</h3>
      <p className="text-xs mt-1 opacity-50">Coming soon</p>
    </div>
  );
}

// Map operation keys to icons for ComingSoon
const OP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  unread: Bell,
  bot_support: MessageSquare,
  admin_support_chat: Shield,
  system_notifications: Bell,
  rate_n_review: Star,
  complains: AlertTriangle,
  rfq: FileText,
  product: ShoppingBag,
  service: Wrench,
  buygroup: ShoppingCart,
  cust_questions: MessageSquare,
  cust_reviews: Star,
  cust_complains: AlertTriangle,
  cust_rfq: FileText,
  cust_product: ShoppingBag,
  cust_service: Wrench,
  cust_buygroup: ShoppingCart,
  pre_order: HelpCircle,
  order_updates: Package,
  shipping: Truck,
  returns: RotateCcw,
  disputes: Scale,
  payment_issues: CreditCard,
  wallet_transactions: Wallet,
  invoice_questions: Receipt,
  team_chat: Users,
  internal_notes: StickyNote,
};

// Operations that show product selector + QuestionAndComments
const PRODUCT_OPERATIONS = ["questions_n_comments", "product", "cust_questions", "cust_product"];
const SERVICE_OPERATIONS = ["service", "cust_service"];

const VendorOperations = () => {
  const t = useTranslations();
  const { langDir } = useAuth();

  const [selectedOperation, setSelectedOperation] = useState<string>("questions_n_comments");
  const [selectedProduct, setSelectedProduct] = useState<{ [key: string]: any }>();
  const [selectedService, setSelectedService] = useState<{ [key: string]: any }>();
  const [productType, setProductType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");

  const showProducts = PRODUCT_OPERATIONS.includes(selectedOperation) || SERVICE_OPERATIONS.includes(selectedOperation);
  const isImplemented = selectedOperation === "questions_n_comments";

  return (
    <div className="flex w-full flex-wrap rounded-sm border border-solid border-border">
      {/* Column 1: Category Tree */}
      <Operations
        onSelect={(operation) => {
          setSelectedOperation(operation);
          setSelectedProduct(undefined);
          setSelectedService(undefined);
        }}
      />

      {/* Column 2: Products/Services (when applicable) */}
      {showProducts && (
        <Products
          onSelectProduct={(product) => {
            setSelectedProduct(product);
            setProductType("PRODUCT");
          }}
          onSelectService={(service) => {
            setSelectedService(service);
            setProductType("SERVICE");
          }}
        />
      )}

      {/* Column 3: Content Area */}
      {isImplemented && productType === "PRODUCT" && selectedProduct ? (
        <QuestionAndAnswers
          productId={selectedProduct.productId}
          productAddedBy={selectedProduct.userId}
        />
      ) : isImplemented && productType === "SERVICE" && selectedService ? (
        <ServiceQuestionAndAnswers
          serviceId={selectedService?.id}
          serviceAddedBy={selectedService?.sellerId}
        />
      ) : !showProducts || (showProducts && !selectedProduct && !selectedService) ? (
        <ComingSoon
          title={selectedOperation.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          icon={OP_ICONS[selectedOperation] ?? Construction}
        />
      ) : (
        <ComingSoon
          title={selectedOperation.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          icon={OP_ICONS[selectedOperation] ?? Construction}
        />
      )}
    </div>
  );
};

export default VendorOperations;
