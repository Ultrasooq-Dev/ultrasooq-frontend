"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStateRecommendations } from "@/components/modules/recommendations/EmptyStateRecommendations";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface CartEmptyStateProps {
  haveAccessToken: boolean;
  cartByUserEmpty: boolean;
  cartByUserLoading: boolean;
  cartByDeviceEmpty: boolean;
  cartByDeviceLoading: boolean;
  loading: boolean;
}

const CartEmptyState = ({
  haveAccessToken,
  cartByUserEmpty,
  cartByUserLoading,
  cartByDeviceEmpty,
  cartByDeviceLoading,
  loading,
}: CartEmptyStateProps) => {
  const t = useTranslations();
  const router = useRouter();

  const emptyBlock = (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-foreground" translate="no">
        {t("no_cart_items")}
      </h3>
      <p className="mb-6 text-muted-foreground" translate="no">
        {t("add_some_products_to_get_started")}
      </p>
      <Button
        onClick={() => router.push("/trending")}
        className="bg-primary px-6 py-2 text-white hover:bg-primary/90"
      >
        {t("continue_shopping")}
      </Button>
      <div className="mt-8">
        <EmptyStateRecommendations type="cart" />
      </div>
    </div>
  );

  const skeletonBlock = (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 rounded-lg border border-border p-4"
        >
          <Skeleton className="h-20 w-20 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {haveAccessToken && cartByUserEmpty && !cartByUserLoading
        ? emptyBlock
        : null}
      {!haveAccessToken && cartByDeviceEmpty && !cartByDeviceLoading
        ? emptyBlock
        : null}
      {(cartByUserLoading || loading) ? skeletonBlock : null}
      {!haveAccessToken && (cartByDeviceLoading || loading) ? skeletonBlock : null}
    </>
  );
};

export default CartEmptyState;
