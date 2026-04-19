import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

interface UseWishlistActionsParams {
  searchParamsId: string;
  productInWishlist: any;
  meDataId: number | undefined;
  addToWishlist: any;
  deleteFromWishlist: any;
}

export function useWishlistActions({
  searchParamsId,
  productInWishlist,
  meDataId,
  addToWishlist,
  deleteFromWishlist,
}: UseWishlistActionsParams) {
  const t = useTranslations();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeleteFromWishlist = async () => {
    const response = await deleteFromWishlist.mutateAsync({
      productId: Number(searchParamsId),
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
          { productId: searchParamsId, userId: meDataId },
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

  const handleAddToWishlist = async () => {
    if (!!productInWishlist) {
      handleDeleteFromWishlist();
      return;
    }
    const response = await addToWishlist.mutateAsync({
      productId: Number(searchParamsId),
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
          { productId: searchParamsId, userId: meDataId },
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

  return { handleAddToWishlist, handleDeleteFromWishlist };
}
