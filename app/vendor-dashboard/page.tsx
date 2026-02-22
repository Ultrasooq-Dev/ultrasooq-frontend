"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/apis/queries/user.queries";
import { 
  useVendorOrderStats, 
  useVendorRecentOrders, 
  useUpdateOrderStatus, 
  useAddOrderTracking,
  useOrdersBySellerId 
} from "@/apis/queries/orders.queries";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Eye,
  Edit,
  Truck,
  Calendar,
  Filter,
    Search,
    X,
    Phone,
    MapPin,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import Footer from "@/components/shared/Footer";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";

const VendorDashboardPage = () => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const { toast } = useToast();
  const me = useMe();

  // Safe copy helper (works when navigator.clipboard is unavailable)
  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && (navigator as any).clipboard && (window as any).isSecureContext) {
        await (navigator as any).clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast({ title: t("copied"), description: t("address_copied_to_clipboard"), variant: "success" });
    } catch (e) {
      toast({ title: t("error"), description: t("failed_to_copy"), variant: "destructive" });
    }
  };

  // State management
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeTab, setOrderTypeTab] = useState<"ALL" | "BUYGROUP">("ALL");
  const [dateRange, setDateRange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNotes, setTrackingNotes] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateRange, debouncedSearchTerm, limit]);

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter("all");
    setDateRange("all");
    setSearchTerm("");
    setPage(1);
  };

  // API calls
  const { data: orderStats, isLoading: statsLoading, error: statsError } = useVendorOrderStats();
const queryParams = {
    page,
    limit,
    status: statusFilter === "all" ? undefined : statusFilter,
    startDate: dateRange === "custom" ? undefined : getDateRange(dateRange).start,
    endDate: dateRange === "custom" ? undefined : getDateRange(dateRange).end,
    search: debouncedSearchTerm || undefined,
    sellType: orderTypeTab === "BUYGROUP" ? "BUYGROUP" : "NON_BUYGROUP",
  };
  
  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useVendorRecentOrders(queryParams);


  const updateStatusMutation = useUpdateOrderStatus();
  const addTrackingMutation = useAddOrderTracking();

  // Helper function to get date ranges
  function getDateRange(range: string) {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (range) {
      case "all":
        return { start: undefined, end: undefined };
      case "this_month":
        start.setDate(1);
        end.setMonth(now.getMonth() + 1, 0); // Last day of current month
        break;
      case "last_month":
        start.setMonth(now.getMonth() - 1, 1);
        end.setMonth(now.getMonth(), 0);
        break;
      case "this_year":
        start.setMonth(0, 1);
        end.setMonth(11, 31); // Last day of current year
        break;
      case "last_year":
        start.setFullYear(now.getFullYear() - 1, 0, 1);
        end.setFullYear(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return { start: undefined, end: undefined };
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await updateStatusMutation.mutateAsync({
        orderProductId: selectedOrder.id,
        status: newStatus,
        notes: statusNotes,
      });

      toast({
        title: t("status_updated_successfully"),
        description: t("order_status_has_been_updated"),
        variant: "success",
      });

      setIsStatusUpdateOpen(false);
      setNewStatus("");
      setStatusNotes("");
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failed_to_update_status"),
        variant: "destructive",
      });
    }
  };

  // Handle tracking addition
  const handleAddTracking = async () => {
    if (!selectedOrder || !trackingNumber || !carrier) return;

    try {
      await addTrackingMutation.mutateAsync({
        orderProductId: selectedOrder.id,
        trackingNumber,
        carrier,
        notes: trackingNotes,
      });

      toast({
        title: t("tracking_added_successfully"),
        description: t("tracking_information_has_been_added"),
        variant: "success",
      });

      setIsTrackingOpen(false);
      setTrackingNumber("");
      setCarrier("");
      setTrackingNotes("");
      setIsEditingTracking(false);
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failed_to_add_tracking"),
        variant: "destructive",
      });
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "secondary";
      case "processing":
        return "default";
      case "shipped":
        return "default";
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      case "refunded":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Extract shipping address from various possible shapes
  const getShippingFrom = (order: any) => {
    const list =
      order?.orderProduct_order?.order_orderAddress ||
      order?.order_orderAddress ||
      order?.order?.order_orderAddress ||
      [];
    const addr = Array.isArray(list)
      ? list.find((a: any) => (a?.addressType || a?.addresstype || a?.type) === "SHIPPING") || list.find((a: any) => a?.addressType === "shipping")
      : undefined;
    return addr;
  };

  // Group buygroup orders by product when Buygroup tab is active
  const groupedBuygroupOrders = React.useMemo(() => {
    if (orderTypeTab !== "BUYGROUP" || !recentOrders?.data?.orders?.length) return [] as any[];
    const map: Record<string, any> = {};
    for (const o of recentOrders.data.orders) {
      const item = o.items?.[0];
      if (!item) continue;
      const key = String(item.id);
      if (!map[key]) {
        map[key] = {
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          orders: [],
          totalQuantity: 0,
        };
      }
      map[key].orders.push(o);
      // Sum up the quantity for this product
      map[key].totalQuantity += item.quantity || 1;
    }
    return Object.values(map);
  }, [orderTypeTab, recentOrders?.data?.orders]);

  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});
  const toggleExpand = (pid: string | number) =>
    setExpandedProductIds((prev) => ({ ...prev, [String(pid)]: !prev[String(pid)] }));

  // Bulk status per product group (local state: selected status for group id)
  const [groupBulkStatus, setGroupBulkStatus] = useState<Record<string, string>>({});
  const [groupBulkLoading, setGroupBulkLoading] = useState<Record<string, boolean>>({});

  const handleBulkUpdateGroup = async (group: any) => {
    const pid = String(group.productId);
    const status = groupBulkStatus[pid];
    if (!status) return;
    try {
      setGroupBulkLoading((s) => ({ ...s, [pid]: true }));
      // Update all orders in this group
      for (const order of group.orders) {
        await updateStatusMutation.mutateAsync({
          orderProductId: order.id,
          status,
          notes: undefined,
        });
      }
      toast({
        title: t("status_updated_successfully"),
        description: t("order_status_has_been_updated"),
        variant: "success",
      });
    } catch (e) {
      toast({ title: t("error"), description: t("failed_to_update_status"), variant: "destructive" });
    } finally {
      setGroupBulkLoading((s) => ({ ...s, [pid]: false }));
    }
  };

  return (
    <>
      <title dir={langDir} translate="no">{`${t("vendor_dashboard")} | Ultrasooq`}</title>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-6 lg:px-12 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900" dir={langDir}>
              {t("vendor_dashboard")}
            </h1>
            <p className="text-gray-600 mt-2" dir={langDir}>
              {t("order_management")}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("total_orders")}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : orderStats?.data?.totalOrders || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("pending_orders")}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {statsLoading ? "..." : orderStats?.data?.pendingOrders || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("completed_orders")}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {statsLoading ? "..." : orderStats?.data?.completedOrders || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("total_revenue")}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {statsLoading ? "..." : `${currency.symbol}${orderStats?.data?.totalRevenue || 0}`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for All / Buygroup */}
          <div className="mb-6">
            <div className="inline-flex rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors ${orderTypeTab === "ALL" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50"}`}
                onClick={() => setOrderTypeTab("ALL")}
              >
                {t("all")}
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors ${orderTypeTab === "BUYGROUP" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50"}`}
                onClick={() => setOrderTypeTab("BUYGROUP")}
              >
                {t("buygroup")}
              </button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("filters")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">{t("search")}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder={t("search_orders")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      dir={langDir}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">{t("filter_by_status")}</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("all_statuses")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all_statuses")}</SelectItem>
                      <SelectItem value="pending">{t("pending")}</SelectItem>
                      <SelectItem value="processing">{t("processing")}</SelectItem>
                      <SelectItem value="shipped">{t("shipped")}</SelectItem>
                      <SelectItem value="delivered">{t("delivered")}</SelectItem>
                      <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateRange">{t("date_range")}</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="this_month">{t("this_month")}</SelectItem>
                      <SelectItem value="last_month">{t("last_month")}</SelectItem>
                      <SelectItem value="this_year">{t("this_year")}</SelectItem>
                      <SelectItem value="last_year">{t("last_year")}</SelectItem>
                      <SelectItem value="custom">{t("custom_range")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("clear_filters")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders View */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>{t("recent_orders")}</CardTitle>
                  <CardDescription>
                    {t("manage_your_orders_and_track_their_status")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm text-gray-600 whitespace-nowrap">
                    {t("items_per_page")}:
                  </Label>
                  <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">{t("loading")}</p>
                </div>
              ) : !recentOrders?.data?.orders?.length ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">{t("no_orders_found")}</p>
                </div>
              ) : orderTypeTab === "BUYGROUP" ? (
                <div className="space-y-4">
                  {groupedBuygroupOrders.map((group: any) => (
                    <div key={group.productId} className="border rounded-lg overflow-hidden">
                      <button type="button" className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50" onClick={() => toggleExpand(group.productId)}>
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                            {group.productImage ? (
                              <img src={group.productImage} alt={group.productName} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{group.productName}</div>
                            <div className="text-xs text-gray-500">
                              <span className="font-semibold">{group.orders.length} {group.orders.length === 1 ? t("order") : t("orders")}</span> · <span className="font-semibold">{t("total_quantity")}: {group.totalQuantity || 0}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-primary font-medium">{expandedProductIds[group.productId] ? t("hide") : t("show")}</span>
                      </button>
                      {expandedProductIds[group.productId] ? (
                        <div className="divide-y">
                          {/* Bulk status update for this product group */}
                          <div className="p-4 bg-gray-50 flex items-center justify-between gap-3">
                            <div className="text-sm text-gray-700 font-medium">
                              {t("update_status")} · {group.orders.length} {group.orders.length === 1 ? t("order") : t("orders")}
                            </div>
                            <div className="flex items-center gap-2">
                              <Select value={groupBulkStatus[String(group.productId)] || ""} onValueChange={(v) => setGroupBulkStatus((s) => ({ ...s, [String(group.productId)]: v }))}>
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder={t("select_status")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">{t("pending")}</SelectItem>
                                  <SelectItem value="processing">{t("processing")}</SelectItem>
                                  <SelectItem value="shipped">{t("shipped")}</SelectItem>
                                  <SelectItem value="delivered">{t("delivered")}</SelectItem>
                                  <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={() => handleBulkUpdateGroup(group)} disabled={groupBulkLoading[String(group.productId)] || !groupBulkStatus[String(group.productId)]}>
                                {groupBulkLoading[String(group.productId)] ? t("updating") : t("update_status")}
                              </Button>
                            </div>
                          </div>
                          {group.orders.map((order: any) => {
                            const isProcessing = order.status?.toLowerCase() === "processing";
                            const maskedCustomerName = isProcessing 
                              ? order.customerName || t("unknown_customer")
                              : (order.customerName ? order.customerName.substring(0, 3) + "xxxx" : "xxxx");
                            
                            return (
                              <div key={order.id} className="p-4 flex items-center gap-4">
                                <div className="flex-1">
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium">#{order.id}</span> · {maskedCustomerName} · {format(new Date(order.createdAt), "MMM dd, yyyy")}
                                  </div>
                                  {(() => {
                                    const addr = getShippingFrom(order);
                                    if (!addr) return null;
                                    if (isProcessing) {
                                      const snippet = [
                                        `${addr.firstName || ""} ${addr.lastName || ""}`.trim(),
                                        addr.city,
                                        addr.postCode,
                                        addr.country,
                                      ].filter(Boolean).join(", ");
                                      return <p className="text-xs text-gray-600">{snippet}</p>;
                                    } else {
                                      const maskedName = addr.firstName ? addr.firstName.substring(0, 2) + "xxx" : "xxxx";
                                      const maskedCity = addr.city ? addr.city.substring(0, 2) + "xxx" : "xxxx";
                                      const snippet = [
                                        maskedName,
                                        maskedCity,
                                        "xxxx",
                                        addr.country,
                                      ].filter(Boolean).join(", ");
                                      return <p className="text-xs text-gray-600">{snippet}</p>;
                                    }
                                  })()}
                                  <div className="text-xs text-gray-500">{currency.symbol}{order.totalAmount || 0}</div>
                                </div>
                                <Badge variant={getStatusBadgeVariant(order.status)}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                  </span>
                                </Badge>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setIsOrderDetailsOpen(true); }}>
                                    <Eye className="h-4 w-4 mr-1" />{t("view_details")}
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setIsStatusUpdateOpen(true); }}>
                                    <Edit className="h-4 w-4 mr-1" />{t("update_status")}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">{t("order_id")}</th>
                        <th className="text-left py-3 px-4">{t("customer_name")}</th>
                        <th className="text-left py-3 px-4">{t("order_date")}</th>
                        <th className="text-left py-3 px-4">{t("order_status")}</th>
                        <th className="text-left py-3 px-4">{t("order_total")}</th>
                        <th className="text-left py-3 px-4">{t("payment_method")}</th>
                        <th className="text-left py-3 px-4">{t("ship_to")}</th>
                        <th className="text-left py-3 px-4">{t("actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders?.data?.orders?.map((order: any) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">#{order.id}</td>
                          <td className="py-3 px-4">{order.customerName || t("unknown_customer")}</td>
                          <td className="py-3 px-4">{format(new Date(order.createdAt), "MMM dd, yyyy")}</td>
                          <td className="py-3 px-4">
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              <span className="flex items-center gap-1">{getStatusIcon(order.status)}{order.status}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">{currency.symbol}{order.totalAmount || 0}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                              {order.paymentMethod || t("unknown")}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              const shipping = getShippingFrom(order);
                              const name = shipping ? `${shipping.firstName || ""} ${shipping.lastName || ""}`.trim() : "";
                              const line = shipping
                                ? [shipping?.city, shipping?.postCode, shipping?.country].filter(Boolean).join(", ")
                                : "";
                              return (
                                <div className="max-w-[240px]">
                                  <div className="truncate text-sm text-gray-900">{name || t("not_provided")}</div>
                                  <div className="truncate text-xs text-gray-600">{line}</div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setIsOrderDetailsOpen(true); }}>
                                <Eye className="h-4 w-4 mr-1" />{t("view_details")}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setIsStatusUpdateOpen(true); }}>
                                <Edit className="h-4 w-4 mr-1" />{t("update_status")}
                              </Button>
                              {order.status === "shipped" && !order?.tracking?.trackingNumber && (
                                <Button variant="outline" size="sm" onClick={() => { 
                                  setSelectedOrder(order); 
                                  setTrackingNumber("");
                                  setCarrier("");
                                  setTrackingNotes("");
                                  setIsEditingTracking(false);
                                  setIsTrackingOpen(true); 
                                }}>
                                  <Truck className="h-4 w-4 mr-1" />{t("add_tracking")}
                                </Button>
                              )}
                              {order.status === "shipped" && order?.tracking?.trackingNumber && (
                                <Button variant="outline" size="sm" onClick={() => { 
                                  setSelectedOrder(order); 
                                  setTrackingNumber(order?.tracking?.trackingNumber || "");
                                  setCarrier(order?.tracking?.carrier || "");
                                  setTrackingNotes(order?.tracking?.notes || "");
                                  setIsEditingTracking(true);
                                  setIsTrackingOpen(true); 
                                }}>
                                  <Truck className="h-4 w-4 mr-1" />{t("edit_tracking")}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {(() => {
                if (!recentOrders?.data?.orders || recentOrders.data.orders.length === 0) return false;
                
                const pagination = recentOrders.data.pagination;
                if (!pagination) return false;
                
                const totalItems = pagination.totalItems || 0;
                const totalPages = pagination.totalPages || Math.ceil(totalItems / limit);
                
                // Show pagination if there's more than 1 page
                return totalPages > 1;
              })() && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {(() => {
                      const pagination = recentOrders.data.pagination || {};
                      const ordersCount = recentOrders.data.orders?.length || 0;
                      const totalItems = pagination.totalItems || ordersCount;
                      const currentPage = pagination.currentPage || page;
                      const itemsPerPage = limit;
                      const start = (currentPage - 1) * itemsPerPage + 1;
                      const end = Math.min(currentPage * itemsPerPage, totalItems);
                      return `${t("showing")} ${start} ${t("to")} ${end} ${t("of")} ${totalItems} ${t("orders")}`;
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const pagination = recentOrders.data.pagination || {};
                      const ordersCount = recentOrders.data.orders?.length || 0;
                      const totalItems = pagination.totalItems || ordersCount;
                      const totalPages = pagination.totalPages || Math.ceil(totalItems / limit);
                      const currentPage = pagination.currentPage || page;
                      return (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1 || ordersLoading}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            {t("previous")}
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  variant={pageNum === currentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setPage(pageNum)}
                                  disabled={ordersLoading}
                                  className="min-w-[40px]"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages || ordersLoading}
                          >
                            {t("next")}
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Details Modal */}
        <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("order_details")}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (() => {
              const isProcessing = selectedOrder.status?.toLowerCase() === "processing";
              const maskedCustomerName = isProcessing 
                ? selectedOrder.customerName || t("unknown_customer")
                : (selectedOrder.customerName ? selectedOrder.customerName.substring(0, 3) + "xxxx" : "xxxx");
              const maskedEmail = isProcessing 
                ? selectedOrder.customerEmail || t("not_provided")
                : "xxxx@xxxx.xxx";
              const maskedPhone = isProcessing 
                ? selectedOrder.customerPhone || t("not_provided")
                : "xxxx";
              
              return (
                <>
                  <div className="space-y-6">
                    {/* Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>{t("order_information")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("order_number")}:</span>
                            <span className="font-medium">{selectedOrder.orderNumber || `#${selectedOrder.id}`}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("order_id")}:</span>
                            <span className="font-medium">#{selectedOrder.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("order_date")}:</span>
                            <span>{format(new Date(selectedOrder.createdAt), "MMM dd, yyyy")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("order_time")}:</span>
                            <span>{format(new Date(selectedOrder.createdAt), "HH:mm:ss")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("order_status")}:</span>
                            <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                              {selectedOrder.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("order_total")}:</span>
                            <span className="font-bold">{currency.symbol}{selectedOrder.totalAmount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("payment_method")}:</span>
                            <span className="font-medium">{selectedOrder.paymentMethod || t("unknown")}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>{t("customer_info")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("customer_name")}:</span>
                            <span>{maskedCustomerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("email")}:</span>
                            <span>{maskedEmail}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t("phone")}:</span>
                            <span>{maskedPhone}</span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>{t("shipping_address")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const addr = getShippingFrom(selectedOrder);
                            if (!addr)
                              return <div className="text-gray-500">{t("not_provided")}</div>;
                            
                            if (isProcessing) {
                              return (
                                <div className="space-y-2 flex flex-col">
                                  <div className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                    <span>{[addr.firstName, addr.lastName].filter(Boolean).join(" ")}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-700 text-base">
                                    <Phone className="h-4 w-4" />
                                    <span>{addr.phone || t("not_provided")}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-700 text-base">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-medium">{[addr.address, addr.city, addr.province, addr.postCode, addr.country].filter(Boolean).join(", ")}</span>
                                  </div>
                                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(([
                                    [addr.firstName, addr.lastName].filter(Boolean).join(" "),
                                    addr.phone,
                                    addr.address,
                                    addr.city,
                                    addr.province,
                                    addr.postCode,
                                    addr.country
                                  ].filter(Boolean).join(", ")).trim())}>
                                    {t("copy_address")}
                                  </Button>
                                </div>
                              );
                            } else {
                              const maskedName = addr.firstName ? addr.firstName.substring(0, 2) + "xxx" : "xxxx";
                              const maskedCity = addr.city ? addr.city.substring(0, 2) + "xxx" : "xxxx";
                              return (
                                <div className="space-y-2 flex flex-col">
                                  <div className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                    <span>{maskedName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-700 text-base">
                                    <Phone className="h-4 w-4" />
                                    <span>xxxx</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-700 text-base">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-medium">{[maskedCity, "xxxx", addr.country].filter(Boolean).join(", ")}</span>
                                  </div>
                                </div>
                              );
                            }
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("order_items")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedOrder.items?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <Package className={`h-8 w-8 text-gray-400 ${item.image ? 'hidden' : ''}`} />
                              </div>
                              <div>
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-600">{t("quantity")}: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{currency.symbol}{item.price}</p>
                              <p className="text-sm text-gray-600">{t("subtotal")}: {currency.symbol}{item.price * item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Status Update Modal */}
        <Dialog open={isStatusUpdateOpen} onOpenChange={setIsStatusUpdateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("update_status")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">{t("order_status")}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="processing">{t("processing")}</SelectItem>
                    <SelectItem value="shipped">{t("shipped")}</SelectItem>
                    <SelectItem value="delivered">{t("delivered")}</SelectItem>
                    <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">{t("status_notes")}</Label>
                <Textarea
                  id="notes"
                  placeholder={t("add_notes_about_status_update")}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  dir={langDir}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsStatusUpdateOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updateStatusMutation.isPending || !newStatus}
                >
                  {updateStatusMutation.isPending ? t("updating") : t("update_status")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Tracking Modal */}
        <Dialog open={isTrackingOpen} onOpenChange={(open) => { setIsTrackingOpen(open); if (!open) { setIsEditingTracking(false); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditingTracking ? t("edit_tracking") : t("add_tracking")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="trackingNumber">{t("tracking_number")}</Label>
                <Input
                  id="trackingNumber"
                  placeholder={t("enter_tracking_number")}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  dir={langDir}
                />
              </div>
              <div>
                <Label htmlFor="carrier">{t("carrier")}</Label>
                <Input
                  id="carrier"
                  placeholder={t("enter_carrier_name")}
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  dir={langDir}
                />
              </div>
              <div>
                <Label htmlFor="trackingNotes">{t("tracking_notes")}</Label>
                <Textarea
                  id="trackingNotes"
                  placeholder={t("add_notes_about_tracking")}
                  value={trackingNotes}
                  onChange={(e) => setTrackingNotes(e.target.value)}
                  dir={langDir}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsTrackingOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleAddTracking} disabled={addTrackingMutation.isPending || !trackingNumber || !carrier}>
                  {addTrackingMutation.isPending ? t("updating") : (isEditingTracking ? t("update_tracking") : t("add_tracking"))}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </>
  );
};

export default withActiveUserGuard(VendorDashboardPage);
