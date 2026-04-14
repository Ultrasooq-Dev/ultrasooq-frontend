/**
 * Component-level prop types for order module.
 * Re-exports relevant types from types/order.ts.
 */

export type {
  OrderProductDetail,
  OrderProductImage,
  OrderRecord,
  OrderAddressRecord,
  OrderShippingRecord,
  OrderProductPriceRecord,
  OrderServiceFeature,
  OrderBreakdown,
  OrderTrackingInfo,
  OrderListParams,
  UpdateOrderStatusRequest,
  AddOrderTrackingRequest,
  OrderByIdResponse,
  OrderBySellerIdResponse,
} from "@/types/order";

// ---------------------------------------------------------------------------
// Shared component prop types
// ---------------------------------------------------------------------------

export interface OrderTimelineProps {
  status: string;
  dates: Record<string, string>;
}

export interface AddressCardProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  name: string;
  address: string;
  phone: string;
  pin?: string;
}

export interface TrackingChatPanelProps {
  sellerName: string;
  langDir: string;
  status: string;
  orderId: string;
  onStatusChange?: (newStatus: string) => void;
}

export interface ComplaintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderProductId: number;
  orderNo?: string;
  productName: string;
  onSuccess?: () => void;
}

export interface RefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderProductId: number;
  orderNo?: string;
  amount: number;
  currencySymbol: string;
  onSuccess?: () => void;
}

export interface TrackingMessage {
  id: string;
  type: "stage" | "text" | "attachment" | "confirm";
  emoji?: string;
  stage?: string;
  text: string;
  location?: string;
  time: string;
  sender: "vendor" | "system" | "customer";
}

export interface BuyerOrderCardProps {
  id: number;
  orderProductType?: string;
  productId: number;
  purchasePrice: string;
  productName: string;
  produtctImage?: { id: number; image?: string }[];
  orderQuantity?: number;
  orderId: string;
  orderNo?: string;
  orderStatus: string;
  orderProductDate: string;
  updatedAt: string;
  serviceFeature?: { name?: string; [key: string]: unknown };
  sellerName?: string;
}

export interface SellerOrderCardProps {
  id: number;
  orderProductType?: string;
  productId: number;
  purchasePrice: string;
  productName: string;
  produtctImage?: { id: number; image?: string }[];
  orderQuantity?: number;
  orderId: string;
  orderStatus: string;
  orderProductDate: string;
  updatedAt: string;
  serviceFeature?: { name?: string; [key: string]: unknown };
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerRating?: number;
  buyerOrderCount?: number;
  selected?: boolean;
  onSelect?: (id: number, checked: boolean) => void;
  onStatusChange?: (orderProductId: number, newStatus: string) => void;
}
