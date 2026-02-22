"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GridIcon from "@/components/icons/GridIcon";
import { debounce } from "lodash";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Footer from "@/components/shared/Footer";
import Pagination from "@/components/shared/Pagination";
import { useToast } from "@/components/ui/use-toast";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/apis/queries/user.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useGetAllServices } from "@/apis/queries/services.queries";
import ServiceCard from "@/components/modules/trending/ServiceCard";
import ServiceTable from "@/components/modules/trending/ServiceTable";
import { IoMdAdd } from "react-icons/io";
import ListIcon from "@/components/icons/ListIcon";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";

const ManageServices = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const deviceId = getOrCreateDeviceId() || "";
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);

  const me = useMe();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const allServicesQuery = useGetAllServices({
    page,
    limit,
    sort: sortBy,
    term: searchTerm,
    ownService:true,
  });

  const memoizedServicesList = useMemo(() => {
    return allServicesQuery?.data?.data?.services || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allServicesQuery?.data?.data,
    allServicesQuery?.data?.data?.length,
    page,
    limit,
    searchTerm,
    sortBy,
  ]);

  const handleDeleteFromWishlist = async (productId: number) => {
    const response = await deleteFromWishlist.mutateAsync({
      productId,
    });
    if (response.status) {
      toast({
        title: t("item_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [
          "product-by-id",
          { productId: String(productId), userId: me.data?.data?.id },
        ],
      });
    } else {
      toast({
        title: t("item_not_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleAddToWishlist = async (
    productId: number,
    wishlistArr?: any[],
  ) => {
    const wishlistObject = wishlistArr?.find(
      (item) => item.userId === me.data?.data?.id,
    );
    // return;
    if (wishlistObject) {
      handleDeleteFromWishlist(wishlistObject?.productId);
      return;
    }

    const response = await addToWishlist.mutateAsync({
      productId,
    });
    if (response.status) {
      toast({
        title: t("item_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [
          "product-by-id",
          { productId: String(productId), userId: me.data?.data?.id },
        ],
      });
    } else {
      toast({
        title: response.message || t("item_not_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleSearchService = debounce((event: any) => {
    setSearchTerm(event.target.value);
  }, 1000);

  useEffect(() => {
    if (accessToken) {
      setHaveAccessToken(true);
    } else {
      setHaveAccessToken(false);
    }
  }, [accessToken]);

  return (
    <>
      <title dir={langDir} translate="no">{`${t("store")} | Ultrasooq`}</title>
      <div className="body-content-s1">
        <div className="container m-auto px-3">
          <div className="right-products">
            <div className="existing-product-add-headerPart">
              <ul className="right-filter-lists flex flex-row flex-wrap gap-2 md:flex-nowrap">
                <li className="w-full sm:w-auto">
                  <Input
                    type="text"
                    placeholder={t("search_service")}
                    className="search-box h-[40px] w-full sm:w-[160px] lg:w-80"
                    onChange={handleSearchService}
                    dir={langDir}
                    translate="no"
                  />
                </li>
                <li className="flex">
                  <button
                    className="theme-primary-btn add-btn p-2"
                    onClick={() => router.replace("/manage-services/create-service")}
                    dir={langDir}
                  >
                    <IoMdAdd size={20} />
                    <span className="d-none-mobile" translate="no">
                      {t("add_service")}
                    </span>
                  </button>
                </li>
              </ul>
            </div>
            <div className="products-header-filter">
              <div className="le-info">
              </div>
              <div className="rg-filter">
                <p dir={langDir} translate="no">
                  {t("n_services_found", {
                    n: allServicesQuery.data?.data?.total,
                  })}
                </p>
                <ul>
                  <li>
                    <Select onValueChange={(value) => setSortBy(value)}>
                      <SelectTrigger className="custom-form-control-s1 bg-card">
                        <SelectValue placeholder={t("sort_by")} dir={langDir} translate="no" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="desc" dir={langDir} translate="no">
                            {t("sort_by_latest")}
                          </SelectItem>
                          <SelectItem value="asc" dir={langDir} translate="no">
                            {t("sort_by_oldest")}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </li>

                  <li>
                    <button
                      type="button"
                      className="view-type-btn"
                      onClick={() => setViewType("grid")}
                    >
                      <GridIcon active={viewType === "grid"} />
                    </button>
                  </li>

                  <li>
                    <button
                      type="button"
                      className="view-type-btn"
                      onClick={() => setViewType("list")}
                    >
                      <ListIcon active={viewType === "list"} />
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {allServicesQuery.isLoading && viewType === "grid" ? (
              <div className="grid grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, index: number) => (
                  <SkeletonProductCardLoader key={index} />
                ))}
              </div>
            ) : null}

            {!memoizedServicesList.length && !allServicesQuery.isLoading ? (
              <p className="text-center text-sm font-medium" dir={langDir} translate="no">
                {t("no_data_found")}
              </p>
            ) : null}

            {viewType === "grid" ? (
              <div className="product-list-s1">
                {memoizedServicesList.map((item: any) => {
                  return (
                    <ServiceCard
                      key={item.id}
                      item={item}
                      manageService={true}
                    />
                  );
                })}
              </div>
            ) : null}

            {viewType === "list" && memoizedServicesList.length ? (
              <div className="product-list-s1 p-4">
                <ServiceTable services={memoizedServicesList} />
              </div>
            ) : null}

            {allServicesQuery.data?.data?.total > page ? (
              <Pagination
                page={page}
                setPage={setPage}
                totalCount={allServicesQuery.data?.data?.total}
                limit={limit}
              />
            ) : null}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default withActiveUserGuard(ManageServices);
