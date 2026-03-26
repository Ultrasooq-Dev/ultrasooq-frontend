"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  useExternalStores,
  useCreateExternalStore,
  useExternalStoreSubscribedProducts,
} from "@/apis/queries/external-dropship.queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  CopyIcon,
  Loader2,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PackageIcon,
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import Image from "next/image";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";

const ExternalStoresPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [expandedStoreId, setExpandedStoreId] = useState<number | null>(null);

  const externalStoresQuery = useExternalStores(true);
  const createStoreMutation = useCreateExternalStore();

  const handleCreateStore = async () => {
    if (!name.trim()) {
      toast({
        title: t("validation_error"),
        description: t("please_fill_all_required_fields"),
        variant: "destructive",
      });
      return;
    }

    try {
      await createStoreMutation.mutateAsync({
        name: name.trim(),
        platform: platform || undefined,
      });

      setName("");
      setPlatform("");

      toast({
        title: t("store_created_successfully"),
        description: t("external_store_created_description"),
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: t("error"),
        description:
          error?.response?.data?.message || t("something_went_wrong"),
        variant: "destructive",
      });
    }
  };

  const handleCopy = (value: string) => {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        navigator.clipboard.writeText(value);
        toast({
          title: t("copied_to_clipboard"),
          description: value,
          variant: "default",
        });
      } else {
        toast({
          title: t("copied_to_clipboard"),
          description: value,
          variant: "default",
        });
      }
    } catch (err) {
      toast({
        title: t("error"),
        description: t("something_went_wrong"),
        variant: "destructive",
      });
    }
  };

  const toggleStoreProducts = (storeId: number) => {
    setExpandedStoreId(expandedStoreId === storeId ? null : storeId);
  };

  const stores = externalStoresQuery.data?.data || [];

  return (
    <div
      className={`min-h-screen bg-gray-50 px-4 py-6 sm:px-8 ${
        langDir === "rtl" ? "rtl" : ""
      }`}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("external_stores")}
          </h1>
          <p className="text-sm text-gray-600">
            {t("external_stores_description")}
          </p>
        </div>

        {/* Create store form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-indigo-600" />
              <span>{t("create_external_store")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("store_name")}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("store_name_placeholder")}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("platform_optional")}
                </label>
                <Input
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder={t("platform_placeholder")}
                />
              </div>
            </div>
            <Button
              onClick={handleCreateStore}
              disabled={createStoreMutation.isPending}
              className="mt-2"
            >
              {createStoreMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("create_store")}
            </Button>
          </CardContent>
        </Card>

        {/* Stores list */}
        <Card>
          <CardHeader>
            <CardTitle>{t("your_external_stores")}</CardTitle>
          </CardHeader>
          <CardContent>
            {externalStoresQuery.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : stores.length === 0 ? (
              <p className="py-4 text-sm text-gray-600">
                {t("no_external_stores_yet")}
              </p>
            ) : (
              <div className="space-y-4">
                {stores.map((store: any) => {
                  const apiBase = getApiUrl().replace(/\/$/, "");
                  const jsonFeed = `${apiBase}/external-dropship/feeds/${store.feedToken}/products.json`;
                  const xmlFeed = `${apiBase}/external-dropship/feeds/${store.feedToken}/products.xml`;
                  const csvFeed = `${apiBase}/external-dropship/feeds/${store.feedToken}/products.csv`;
                  const webhookUrl = `${apiBase}/external-dropship/webhooks/${store.feedToken}/orders`;

                  return (
                    <div
                      key={store.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            {store.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {store.platform || t("platform_generic")}
                          </p>
                        </div>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          {t("active")}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-700">
                            {t("json_feed_url")}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopy(jsonFeed)}
                            className="flex items-center gap-2 truncate rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-left font-mono text-[11px] text-gray-700 hover:bg-gray-100"
                          >
                            <span className="flex-1 truncate">{jsonFeed}</span>
                            <CopyIcon className="h-3 w-3 flex-none text-gray-500" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-gray-700">
                            {t("xml_feed_url")}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopy(xmlFeed)}
                            className="flex items-center gap-2 truncate rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-left font-mono text-[11px] text-gray-700 hover:bg-gray-100"
                          >
                            <span className="flex-1 truncate">{xmlFeed}</span>
                            <CopyIcon className="h-3 w-3 flex-none text-gray-500" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-gray-700">
                            {t("csv_feed_url")}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopy(csvFeed)}
                            className="flex items-center gap-2 truncate rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-left font-mono text-[11px] text-gray-700 hover:bg-gray-100"
                          >
                            <span className="flex-1 truncate">{csvFeed}</span>
                            <CopyIcon className="h-3 w-3 flex-none text-gray-500" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-gray-700">
                            {t("order_webhook_url")}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopy(webhookUrl)}
                            className="flex items-center gap-2 truncate rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-left font-mono text-[11px] text-gray-700 hover:bg-gray-100"
                          >
                            <span className="flex-1 truncate">
                              {webhookUrl}
                            </span>
                            <CopyIcon className="h-3 w-3 flex-none text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* View Subscribed Products Button */}
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => toggleStoreProducts(store.id)}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            <span>{t("view_subscribed_products")}</span>
                          </div>
                          {expandedStoreId === store.id ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Subscribed Products List */}
                        {expandedStoreId === store.id && (
                          <SubscribedProductsList storeId={store.id} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Separate component for subscribed products list
const SubscribedProductsList = ({ storeId }: { storeId: number }) => {
  const t = useTranslations();
  const subscribedProductsQuery = useExternalStoreSubscribedProducts(
    storeId,
    true,
  );

  if (subscribedProductsQuery.isLoading) {
    return (
      <div className="mt-4 flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (subscribedProductsQuery.isError) {
    return (
      <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {t("error_loading_products")}
      </div>
    );
  }

  const products = subscribedProductsQuery.data?.data || [];

  if (products.length === 0) {
    return (
      <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        {t("no_products_subscribed_yet")}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">
        {t("subscribed_products")} ({products.length})
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((subscription: any) => {
          const product = subscription.product || subscription;
          const productImage =
            product.productImages?.[0]?.image || product.productImage;
          const priceRow = product.product_productPrice?.[0];
          const price =
            priceRow?.offerPrice ??
            priceRow?.productPrice ??
            product.offerPrice ??
            product.productPrice;

          return (
            <div
              key={subscription.id || product.id}
              className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="flex gap-3">
                {/* Product Image */}
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                  {productImage && validator.isURL(productImage) ? (
                    productImage.includes("puremoon.s3.amazonaws.com") ? (
                      <Image
                        src={productImage}
                        alt={product.productName || "Product"}
                        fill
                        sizes="64px"
                        className="object-cover"
                        blurDataURL="/images/product-placeholder.png"
                        placeholder="blur"
                      />
                    ) : (
                      <img
                        src={productImage}
                        alt={product.productName || "Product"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = PlaceholderImage.src;
                        }}
                      />
                    )
                  ) : (
                    <Image
                      src={PlaceholderImage}
                      alt="Product"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {product.productName || "-"}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {t("price")}:{" "}
                    <span className="font-medium text-blue-600">
                      ${price || "0"}
                    </span>
                  </p>
                  {subscription.externalProductId && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t("external_id")}: {subscription.externalProductId}
                    </p>
                  )}
                  {subscription.externalSku && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t("external_sku")}: {subscription.externalSku}
                    </p>
                  )}
                  <span
                    className={`mt-2 inline-block px-2 py-0.5 text-xs rounded-full ${
                      subscription.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {subscription.status === "ACTIVE"
                      ? t("active")
                      : t("inactive")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExternalStoresPage;
