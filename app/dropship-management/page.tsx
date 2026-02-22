"use client";

import React, { useState } from "react";
import { useWholesaleProducts, useWholesaleDashboard } from "@/apis/queries/product.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import validator from "validator";
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, Eye } from "lucide-react";
import Pagination from "@/components/shared/Pagination";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWholesaleProductSales } from "@/apis/queries/product.queries";

export default function DropshipManagementPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  
  const [page, setPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showSalesModal, setShowSalesModal] = useState(false);
  
  const limit = 12;

  // Fetch data
  const wholesaleProductsQuery = useWholesaleProducts({ page, limit });
  const dashboardQuery = useWholesaleDashboard();
  const salesQuery = useWholesaleProductSales(
    selectedProductId || 0,
    !!selectedProductId
  );

  const wholesaleProducts = wholesaleProductsQuery?.data?.data || [];
  const dashboard = dashboardQuery?.data?.data || null;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleViewSales = (productId: number) => {
    setSelectedProductId(productId);
    setShowSalesModal(true);
  };

  const handleCreateWholesaleProduct = () => {
    router.push("/product");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("dropship_dashboard")}
          </h1>
          <p className="text-gray-600">
            {t("manage_your_wholesale_products_and_track_reseller_sales")}
          </p>
        </div>

        {/* Dashboard Statistics */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t("wholesale_products")}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboard.summary?.totalWholesaleProducts || 0}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="w-8 h-8 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t("active_resellers")}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboard.summary?.totalActiveResellers || 0}
                  </p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <Users className="w-8 h-8 text-success" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t("total_orders")}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboard.summary?.totalOrders || 0}
                  </p>
                </div>
                <div className="p-3 bg-info/10 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-info" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t("total_revenue")}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${dashboard.summary?.totalRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-warning/10 rounded-lg">
                  <DollarSign className="w-8 h-8 text-warning" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Top Resellers Section */}
        {dashboard?.topResellers && dashboard.topResellers.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t("top_resellers")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      {t("reseller")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      {t("products")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      {t("orders")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      {t("revenue")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.topResellers.map((reseller: any, index: number) => (
                    <tr key={reseller.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {reseller.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reseller.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">
                        {reseller.products}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">
                        {reseller.orders}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-success">
                        ${reseller.revenue?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Wholesale Products List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {t("my_wholesale_products")}
            </h2>
            <Button onClick={handleCreateWholesaleProduct}>
              <Package className="w-4 h-4 mr-2" />
              {t("create_wholesale_product")}
            </Button>
          </div>

          {wholesaleProductsQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </Card>
              ))}
            </div>
          ) : wholesaleProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("no_wholesale_products")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("create_your_first_wholesale_product")}
              </p>
              <Button onClick={handleCreateWholesaleProduct}>
                {t("create_wholesale_product")}
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {wholesaleProducts.map((product: any) => (
                <Card key={product.id} className="p-6">
                  <div className="flex items-start space-x-6">
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={
                          product.productImages?.[0]?.image &&
                          validator.isURL(product.productImages[0].image)
                            ? product.productImages[0].image
                            : PlaceholderImage
                        }
                        alt={product.productName}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {product.productName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="font-medium text-success">
                              {t("wholesale_price")}: ${Number(product.productPrice).toFixed(2)}
                            </span>
                            <span>
                              {t("stock")}: {product.product_productPrice?.[0]?.stock || 0}
                            </span>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-info/10 text-info text-xs font-semibold rounded-full">
                          {t("wholesale")}
                        </span>
                      </div>

                      {/* Sales Statistics */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">
                            {t("resellers_selling")}
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {product.wholesaleStats?.totalResellers || 0}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">
                            {t("total_orders")}
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {product.wholesaleStats?.totalOrders || 0}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">
                            {t("total_revenue")}
                          </div>
                          <div className="text-xl font-bold text-success">
                            ${product.wholesaleStats?.totalRevenue?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>

                      {/* Resellers Preview */}
                      {product.wholesaleStats?.resellers && product.wholesaleStats.resellers.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm text-gray-700 font-medium mb-2">
                            {t("top_resellers")}:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {product.wholesaleStats.resellers.slice(0, 5).map((reseller: any) => (
                              <div
                                key={reseller.id}
                                className="bg-primary/5 px-3 py-1 rounded-full text-sm"
                              >
                                <span className="font-medium text-primary">
                                  {reseller.name}
                                </span>
                                <span className="text-primary ml-2">
                                  ({reseller.orders} {t("orders")})
                                </span>
                              </div>
                            ))}
                            {product.wholesaleStats.resellers.length > 5 && (
                              <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                                +{product.wholesaleStats.resellers.length - 5} {t("more")}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSales(product.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t("view_sales_details")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/product?edit=${product.id}`)}
                        >
                          {t("edit")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              {wholesaleProductsQuery?.data?.totalCount > limit && (
                <div className="mt-6">
                  <Pagination
                    page={page}
                    setPage={handlePageChange}
                    totalCount={wholesaleProductsQuery.data.totalCount}
                    limit={limit}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Best Selling Products */}
        {dashboard?.bestSellingProducts && dashboard.bestSellingProducts.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t("best_selling_products")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      {t("product")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      {t("wholesale_price")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      {t("resellers")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      {t("orders")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      {t("revenue")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.bestSellingProducts.map((product: any) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {product.productName}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">
                        ${Number(product.wholesalePrice).toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">
                        {product.resellers}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">
                        {product.totalOrders}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-success">
                        ${product.totalRevenue?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Sales Details Modal */}
        <Dialog open={showSalesModal} onOpenChange={setShowSalesModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("sales_by_reseller")}</DialogTitle>
            </DialogHeader>

            {salesQuery.isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">{t("loading")}</p>
              </div>
            ) : salesQuery?.data?.data ? (
              <div className="space-y-6">
                {/* Product Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {salesQuery.data.data.product?.productName}
                  </h3>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span>
                      {t("wholesale_price")}: ${Number(salesQuery.data.data.product?.wholesalePrice).toFixed(2)}
                    </span>
                    <span>
                      {t("stock")}: {salesQuery.data.data.product?.stock}
                    </span>
                  </div>
                </div>

                {/* Sales by Reseller */}
                {salesQuery.data.data.salesByReseller?.map((sale: any) => (
                  <Card key={sale.dropshipProductId} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {sale.reseller.name}
                        </h4>
                        <p className="text-sm text-gray-600">{sale.reseller.email}</p>
                        {sale.reseller.phoneNumber && (
                          <p className="text-sm text-gray-600">{sale.reseller.phoneNumber}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">
                          {t("resale_price")}
                        </div>
                        <div className="text-lg font-bold text-primary">
                          ${Number(sale.resalePrice).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">{t("orders")}</div>
                        <div className="text-lg font-bold">{sale.totalOrders}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">{t("quantity")}</div>
                        <div className="text-lg font-bold">{sale.totalQuantity}</div>
                      </div>
                      <div className="bg-success/5 p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">{t("your_revenue")}</div>
                        <div className="text-lg font-bold text-success">
                          ${sale.wholesaleRevenue?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <div className="bg-primary/5 p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">{t("reseller_profit")}</div>
                        <div className="text-lg font-bold text-primary">
                          ${sale.resellerProfit?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders */}
                    {sale.recentOrders && sale.recentOrders.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          {t("recent_orders")}:
                        </div>
                        <div className="space-y-2">
                          {sale.recentOrders.map((order: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                            >
                              <span className="text-gray-700">{order.orderNo}</span>
                              <span className="text-gray-600">Qty: {order.quantity}</span>
                              <span className="text-gray-600">
                                {new Date(order.orderDate).toLocaleDateString()}
                              </span>
                              <span className="text-success font-medium">
                                ${order.wholesaleAmount?.toFixed(2)}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                order.status === 'DELIVERED' ? 'bg-success/10 text-success' :
                                order.status === 'SHIPPED' ? 'bg-primary/10 text-primary' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-600">
                {t("no_sales_data_available")}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

