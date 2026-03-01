"use client";
import React, { useState } from "react";
import Footer from "@/components/shared/Footer";
import { useRouter } from "next/navigation";
import { MdOutlineChevronLeft } from "react-icons/md";
import { Button } from "@/components/ui/button";
import WishlistCard from "@/components/modules/wishlist/WishlistCard";
import {
  useDeleteFromWishList,
  useWishlist,
} from "@/apis/queries/wishlist.queries";
import { useToast } from "@/components/ui/use-toast";
import Pagination from "@/components/shared/Pagination";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/apis/queries/user.queries";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const WishlistPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const wishlistQuery = useWishlist({ page, limit });
  const deleteFromWishlist = useDeleteFromWishList();
  const queryClient = useQueryClient();

  const me = useMe();

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

  return (
    <>
      <title dir={langDir} translate="no">{`${t("wishlist")} | Ultrasooq`}</title>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <section className="w-full py-8">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="mb-8">
              <div className="mb-6 flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg border-border hover:bg-muted"
                  onClick={() => router.back()}
                >
                  <MdOutlineChevronLeft size="20" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl" dir={langDir} translate="no">
                    {t("my_wishlist")}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground" translate="no">
                    {t("manage_your_saved_items")}
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              {wishlistQuery.data?.data?.length ? (
                <div className="rounded-xl border border-border bg-card px-6 py-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-muted-foreground" translate="no">
                        {wishlistQuery.data?.data?.length} {wishlistQuery.data?.data?.length === 1 ? t("item") : t("items")}
                      </span>
                    </div>
                    {wishlistQuery.data?.totalCount > wishlistQuery.data?.data?.length && (
                      <span className="text-xs text-muted-foreground" translate="no">
                        {t("total")}: {wishlistQuery.data?.totalCount} {t("items")}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              {/* Empty State */}
              {!wishlistQuery.isLoading && !wishlistQuery.data?.data?.length ? (
                <div className="overflow-hidden rounded-xl border-2 border-dashed border-border bg-card p-12 text-center shadow-sm">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/5">
                    <svg
                      className="h-10 w-10 text-destructive/70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-foreground" dir={langDir} translate="no">
                    {t("no_wishlist_items")}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground" translate="no">
                    {t("start_adding_items_to_your_wishlist")}
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => router.push("/home")}
                      className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                      translate="no"
                    >
                      {t("browse_products")}
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Loading State */}
              {wishlistQuery.isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <SkeletonProductCardLoader key={index} />
                  ))}
                </div>
              ) : null}

              {/* Wishlist Items Grid */}
              {!wishlistQuery.isLoading && wishlistQuery.data?.data?.length ? (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {wishlistQuery.data?.data.map((item: any) => (
                      <WishlistCard
                        key={item?.id}
                        id={item?.id}
                        productId={item?.productId}
                        wishlistData={item?.wishlist_productDetail}
                        onDeleteFromWishlist={handleDeleteFromWishlist}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Pagination */}
              {wishlistQuery.data?.totalCount && wishlistQuery.data?.totalCount > limit ? (
                <div className="flex justify-center">
                  <Pagination
                    page={page}
                    setPage={setPage}
                    totalCount={wishlistQuery.data?.totalCount}
                    limit={limit}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default WishlistPage;
