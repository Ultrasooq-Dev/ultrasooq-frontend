"use client";
import React, { useEffect, useRef, useState } from "react";
import { useOrdersBySellerId } from "@/apis/queries/orders.queries";
import { FiSearch } from "react-icons/fi";
import { IoIosCloseCircleOutline } from "react-icons/io";
import OrderCard from "@/components/modules/sellerOrders/OrderCard";
import { debounce } from "lodash";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { PERMISSION_ORDERS, checkPermission } from "@/helpers/permission";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import Pagination from "@/components/shared/Pagination";

const SellerOrdersPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasPermission = checkPermission(PERMISSION_ORDERS);
  const searchRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(40);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [orderTime, setOrderTime] = useState<string>("");

  // Read term from URL query parameter on mount
  useEffect(() => {
    const termFromUrl = searchParams?.get("term");
    if (termFromUrl && searchRef.current) {
      setSearchTerm(termFromUrl);
      searchRef.current.value = termFromUrl;
    }
  }, [searchParams]);

  const getYearDates = (
    input: string,
  ): { startDate: string; endDate: string } => {
    const currentDate = new Date();

    if (input === "last30") {
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 30);
      const endDate = currentDate;

      return {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10) + " 23:59:59",
      };
    }

    if (input === "older") {
      const startDate = new Date(currentDate.getFullYear() - 20, 0, 1);
      const endDate = new Date(currentDate.getFullYear() - 1, 11, 31);

      return {
        startDate: `${startDate.getFullYear()}-01-01`,
        endDate: `${endDate.getFullYear()}-12-31`,
      };
    }

    const yearNumber = Number(input);
    if (isNaN(yearNumber) || yearNumber < 1000 || yearNumber > 9999) {
      return { startDate: "", endDate: "" };
    }

    const startDate = `${yearNumber}-01-01`;
    const endDate = `${yearNumber}-12-31`;

    return {
      startDate,
      endDate,
    };
  };

  const ordersBySellerIdQuery = useOrdersBySellerId({
    page: page,
    limit: limit,
    term: searchTerm !== "" ? searchTerm : undefined,
    orderProductStatus: orderStatus,
    startDate: getYearDates(orderTime).startDate,
    endDate: getYearDates(orderTime).endDate,
  }, hasPermission);

  const handleDebounce = debounce((event: any) => {
    setSearchTerm(event.target.value);
  }, 1000);

  const handleClearSearch = () => {
    if (searchRef.current) {
      searchRef.current.value = "";
    }
    setSearchTerm("");
  };

  const handleClearFilter = () => {
    setOrderStatus("");
    setOrderTime("");
  };

  useEffect(() => {
    if (!hasPermission) router.push("/home");
  });

  if (!hasPermission) return <div></div>;

  return (
    <div className="my-order-main">
      <div className="container m-auto px-3">
        <ul className="page-indicator-s1">
          <li>
            <Link href="/home" dir={langDir} translate="no">{t("home")}</Link>
          </li>
          <li>
            <Link href="/seller-orders" dir={langDir} translate="no">{t("my_orders")}</Link>
          </li>
        </ul>

        <div className="my-order-wrapper">
          <div className="left-div">
            <div className="card-box">
              <h2 dir={langDir} translate="no">{t("filter")}</h2>
              <h3 dir={langDir} translate="no">{t("order_status")}</h3>

              <RadioGroup
                className="flex flex-col gap-y-3"
                value={orderStatus}
                onValueChange={setOrderStatus}
              >
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="" id="ALL" />
                  <Label htmlFor="ALL" className="text-base" translate="no">
                    {t("all")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="CONFIRMED" id="CONFIRMED" />
                  <Label htmlFor="CONFIRMED" className="text-base" translate="no">
                    {t("confirmed")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="SHIPPED" id="SHIPPED" />
                  <Label htmlFor="SHIPPED" className="text-base" translate="no">
                    {t("shipped")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="OFD" id="OFD" />
                  <Label htmlFor="OFD" className="text-base" translate="no">
                    {t("on_the_way")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="DELIVERED" id="DELIVERED" />
                  <Label htmlFor="DELIVERED" className="text-base" translate="no">
                    {t("delivered")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="CANCELLED" id="CANCELLED" />
                  <Label htmlFor="CANCELLED" className="text-base" translate="no">
                    {t("cancelled")}
                  </Label>
                </div>
              </RadioGroup>

              <div className="divider"></div>

              <h3 dir={langDir} translate="no">{t("order_time")}</h3>

              <RadioGroup
                className="flex flex-col gap-y-3"
                value={orderTime}
                onValueChange={setOrderTime}
              >
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="last30" id="last30" />
                  <Label htmlFor="last30" className="text-base" translate="no">
                    {t("last_30_days")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="2024" id="2024" />
                  <Label htmlFor="2024" className="text-base">
                    2024
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="2023" id="2023" />
                  <Label htmlFor="2023" className="text-base">
                    2023
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="2022" id="2022" />
                  <Label htmlFor="2022" className="text-base">
                    2022
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="2021" id="2021" />
                  <Label htmlFor="2021" className="text-base">
                    2021
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="2020" id="2020" />
                  <Label htmlFor="2020" className="text-base">
                    2020
                  </Label>
                </div>
                <div className="flex items-center space-x-2" dir={langDir}>
                  <RadioGroupItem value="older" id="older" />
                  <Label htmlFor="older" className="text-base">
                    Older
                  </Label>
                </div>
              </RadioGroup>

              <div className="divider"></div>

              <div className="mt-4 text-center">
                <Button variant="outline" onClick={handleClearFilter} dir={langDir} translate="no">
                  {t("clean_filter")}
                </Button>
              </div>
            </div>
          </div>

          <div className="right-div">
            <div className="order-search-bar flex w-full">
              <div className="relative flex flex-1">
                <input
                  type="text"
                  className="custom-form-control-s1 w-full!"
                  placeholder={t("search")}
                  onChange={handleDebounce}
                  ref={searchRef}
                  dir={langDir}
                  translate="no"
                />
                {searchTerm !== "" ? (
                  <Button
                    variant="ghost"
                    className="absolute right-0 h-full hover:bg-transparent"
                    onClick={handleClearSearch}
                  >
                    <IoIosCloseCircleOutline size={24} />
                  </Button>
                ) : null}
              </div>
              <button type="button" className="search-btn theme-primary-btn" dir={langDir} translate="no">
                <FiSearch />
                {t("search_orders")}
              </button>
            </div>
            <div className="my-order-lists">
              {ordersBySellerIdQuery.isLoading
                ? Array.from({ length: 3 }, (_, i) => i).map((item) => (
                    <div key={uuidv4()} className="mb-3 flex gap-x-3">
                      <Skeleton className="h-28 w-32" />
                      <div className="h-28 flex-1 space-y-2">
                        <Skeleton className="h-8" />
                        <Skeleton className="h-8" />
                        <Skeleton className="h-8" />
                      </div>
                    </div>
                  ))
                : null}

              {!ordersBySellerIdQuery.isLoading &&
              !(ordersBySellerIdQuery?.data?.data as any)?.length ? (
                <div className="w-full p-3">
                  <p className="text-center text-lg font-semibold" dir={langDir} translate="no">
                    {t("no_orders_found")}
                  </p>
                </div>
              ) : null}

              {(ordersBySellerIdQuery?.data?.data as any)?.map(
                (item: {
                  id: number;
                  orderProductType?: string;
                  purchasePrice: string;
                  orderProduct_productPrice: {
                    id: number;
                    offerPrice: string;
                    productPrice_product: {
                      productName: string;
                      productImages: { id: number; image: string }[];
                    };
                    adminDetail: {
                      id: number;
                      tradeRole: string;
                    };
                    productId: number;
                  };
                  serviceFeatures?: {
                    serviceFeatures?: any[];
                  };
                  orderQuantity: number;
                  sellerOrderNo: string;
                  orderProductStatus: string;
                  orderProductDate: string;
                  updatedAt: string;
                }) => (
                  <OrderCard
                    key={item.id}
                    id={item.id}
                    orderProductType={item.orderProductType}
                    purchasePrice={item.purchasePrice}
                    productName={
                      item.orderProduct_productPrice?.productPrice_product
                        ?.productName
                    }
                    produtctImage={
                      item.orderProduct_productPrice?.productPrice_product
                        ?.productImages
                    }
                    orderQuantity={item?.orderQuantity}
                    sellerOrderId={item.sellerOrderNo}
                    orderStatus={item.orderProductStatus}
                    orderProductDate={item.orderProductDate}
                    updatedAt={item.updatedAt}
                    sellerId={item.orderProduct_productPrice?.adminDetail?.id}
                    tradeRole={
                      item.orderProduct_productPrice?.adminDetail?.tradeRole
                    }
                    productPriceId={item.orderProduct_productPrice?.id}
                    productId={item.orderProduct_productPrice?.productId}
                    serviceFeature={item.serviceFeatures?.serviceFeatures?.[0]}
                  />
                ),
              )}

              {(ordersBySellerIdQuery?.data as any)?.totalCount > limit ? (
                <Pagination
                  page={page}
                  setPage={setPage}
                  totalCount={(ordersBySellerIdQuery?.data as any)?.totalCount}
                  limit={limit}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOrdersPage;
