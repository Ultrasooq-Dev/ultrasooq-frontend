import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllManagedProducts,
  useAllProducts,
} from "@/apis/queries/product.queries";
import { cn } from "@/lib/utils";
import { useMe } from "@/apis/queries/user.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useGetAllServices } from "@/apis/queries/services.queries";
import PlaceholderImage from "@/public/images/product-placeholder.png";

type ProductsProps = {
  onSelectProduct?: (item: { [key: string]: any }) => void;
  onSelectService?: (item: { [key: string]: any }) => void;
};

const Products: React.FC<ProductsProps> = ({ onSelectProduct, onSelectService }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const me = useMe();

  const [productType, setProductType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");

  const [productPage, setProductPage] = useState<number>(1);
  const [productLimit] = useState<number>(10);
  const [productList, setProductList] = useState<any[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<{
    [key: string]: any;
  }>();
  const productsQuery = useAllManagedProducts(
    {
      page: productPage,
      limit: productLimit,
      selectedAdminId:
        me?.data?.data?.tradeRole == "MEMBER"
          ? me?.data?.data?.addedBy
          : undefined,
    },
    true,
  );

  const [servicePage, setServicePage] = useState<number>(1);
  const [serviceLimit] = useState<number>(10);
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [servicesCount, setServicesCount] = useState<number>(0);
  const [selectedService, setSelectedService] = useState<{
    [key: string]: any;
  }>();
  const servicesQuery = useGetAllServices(
    {
      page: servicePage,
      limit: serviceLimit,
      ownService: true
    },
    true,
  );

  useEffect(() => {
    const products = (productsQuery?.data?.data || []).map((item: any) => {
      let product = item.productPrice_product;
      item.image = null;
      if (product?.productImages?.length > 0) {
        item.image = product?.productImages[0].image;
      }
      return item;
    });
    setProductList((prevProducts: any[]) => [...prevProducts, ...products]);
    setProductsCount(
      (prevCount: number) =>
        prevCount + (productsQuery?.data?.data?.length || 0),
    );
    if (products.length > 0 && !selectedProduct) selectProduct(products[0]);
  }, [productsQuery?.data?.data, productPage, productLimit]);

  const selectProduct = (product: { [key: string]: any }) => {
    setSelectedProduct(product);
    onSelectProduct?.(product);
  };

  const handleScrollProducts = (elem: any) => {
    if (
      elem.clientHeight + elem.scrollTop >= elem.scrollHeight &&
      productsCount < productsQuery?.data?.totalCount
    ) {
      setProductPage((prevPage: number) => prevPage + 1);
    }
  };

  useEffect(() => {
    const services = (servicesQuery?.data?.data?.services || []).map((item: any) => {
      if (item.images?.length) {
        item.image = item.images[0]?.url;
      }
      return item;
    });
    setServiceList((prevServices: any[]) => [...prevServices, ...services]);
    setServicesCount(
      (prevCount: number) =>
        prevCount + (servicesQuery?.data?.data?.length || 0),
    );
    if (services.length > 0 && !selectedService) selectService(services[0]);
  }, [servicesQuery?.data?.data, servicePage, serviceLimit]);

  const selectService = (service: { [key: string]: any }) => {
    setSelectedService(service);
    onSelectService?.(service);
  };

  const handleScrollServices = (elem: any) => {
    if (
      elem.clientHeight + elem.scrollTop >= elem.scrollHeight &&
      servicesCount < servicesQuery?.data?.data?.total
    ) {
      setServicePage((prevPage: number) => prevPage + 1);
    }
  };

  return (
    <div className="w-full border-r border-solid border-gray-300 lg:w-[18%]">
      <div
        className="flex h-[55px] min-w-full items-center border-b border-solid border-gray-300 px-[10px] py-[10px] text-base font-normal text-foreground"
        dir={langDir}
      >
        <select value={productType} onChange={(e) => {
          // @ts-ignore
          setProductType(e.target.value)
        }}>
          <option value="PRODUCT">{t("product")}</option>
          <option value="SERVICE">{t("service")}</option>
        </select>
      </div>
      {productType == "PRODUCT" ? (
        <div
          className="h-auto w-full overflow-y-auto p-4 lg:h-[720px]"
          onScroll={(e) => handleScrollProducts(e.target)}
        >
          {productsQuery?.isLoading ? (
            <div className="my-2 space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : null}

          {!productsQuery?.isLoading && !productList?.length ? (
            <div className="my-2 space-y-2">
              <p
                className="text-center text-sm font-normal text-gray-500"
                dir={langDir}
                translate="no"
              >
                {t("no_data_found")}
              </p>
            </div>
          ) : null}

          {productList?.map((item: any) => (
            <button
              type="button"
              onClick={() => selectProduct(item)}
              className={cn(
                "flex w-full flex-col flex-wrap rounded-md px-[10px]  py-[20px] xl:flex-row",
                selectedProduct?.productId == item.productId
                  ? "bg-dark-orange text-white shadow-lg"
                  : "",
              )}
              key={item.id}
            >
              <div className="relative h-[40px] w-[40px] rounded-full">
                <Image
                  src={item.image || item.productPrice_product?.barcode}
                  alt="global-icon"
                  fill
                  className="rounded-full"
                />
              </div>
              <div className="flex w-full flex-wrap items-center justify-start gap-y-1 whitespace-pre-wrap break-all xl:w-[calc(100%-2.5rem)] xl:pl-3">
                <div className="flex w-full">
                  <h4 className="text-foreground text-left text-[13px] font-normal uppercase xl:text-[14px]">
                    {item.productPrice_product?.productName}
                  </h4>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div
          className="h-auto w-full overflow-y-auto p-4 lg:h-[720px]"
          onScroll={(e) => handleScrollServices(e.target)}
        >
          {servicesQuery?.isLoading ? (
            <div className="my-2 space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : null}

          {!servicesQuery?.isLoading && !productList?.length ? (
            <div className="my-2 space-y-2">
              <p
                className="text-center text-sm font-normal text-gray-500"
                dir={langDir}
                translate="no"
              >
                {t("no_data_found")}
              </p>
            </div>
          ) : null}

          {serviceList?.map((item: any) => (
            <button
              type="button"
              onClick={() => selectService(item)}
              className={cn(
                "flex w-full flex-col flex-wrap rounded-md px-[10px]  py-[20px] xl:flex-row",
                selectedService?.id == item.id
                  ? "bg-dark-orange text-white shadow-lg"
                  : "",
              )}
              key={item.id}
            >
              <div className="relative h-[40px] w-[40px] rounded-full">
                <Image
                  src={item.image || PlaceholderImage}
                  alt="global-icon"
                  fill
                  className="rounded-full"
                />
              </div>
              <div className="flex w-full flex-wrap items-center justify-start gap-y-1 whitespace-pre-wrap break-all xl:w-[calc(100%-2.5rem)] xl:pl-3">
                <div className="flex w-full">
                  <h4 className="text-foreground text-left text-[13px] font-normal uppercase xl:text-[14px]">
                    {item.serviceName}
                  </h4>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
