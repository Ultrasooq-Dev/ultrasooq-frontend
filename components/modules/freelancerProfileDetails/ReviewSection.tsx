import React, { useEffect, useState } from "react";
import { useAllProductPriceReviewBySellerId } from "@/apis/queries/review.queries";
import { Button } from "@/components/ui/button";
import ProductReviewCard from "./ProductReviewCard";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SellerReviewForm from "@/components/shared/SellerReviewForm";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type ReviewSectionProps = {
  sellerId?: string;
};

const ReviewSection: React.FC<ReviewSectionProps> = ({ sellerId }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [sortType, setSortType] = useState<"highest" | "lowest" | "newest">(
    "newest",
  );
  const [reviewId, setReviewId] = useState<number>();
  const [activeProductPriceId, setActiveProductPriceId] = useState<
    string | null
  >();
  const [activeProductId, setActiveProductId] = useState<string | null>();

  const reviewsQuery = useAllProductPriceReviewBySellerId(
    {
      page: 1,
      limit: 10,
      sortType,
      sellerId: sellerId || "",
    },
    !!sellerId,
  );

  const handleToggleReviewModal = () =>
    setIsReviewModalOpen(!isReviewModalOpen);

  useEffect(() => {
    const params = new URLSearchParams(document.location.search);

    let productPriceId = params.get("productPriceId");
    let productId = params.get("productId");

    setActiveProductPriceId(productPriceId);
    setActiveProductId(productId);
  }, []);

  return (
    <div className="w-full">
      <div className="flex w-full flex-wrap items-center justify-between">
        <div className="flex w-auto flex-wrap items-start justify-start">
          <h2
            className="mb-0 mr-7 text-2xl font-semibold leading-7 text-color-dark"
            dir={langDir}
            translate="no"
          >
            {t("ratings_n_reviews")}
          </h2>
          <div className="flex w-auto flex-col">
            <div className="flex w-auto items-center justify-start">
              <h4 className="mb-0 mr-2.5 text-2xl font-medium leading-7 text-color-dark">
                {/* {calculateAvgRating ? `${calculateAvgRating}.0` : "0"} */}
              </h4>
              {/* {calculateRatings(calculateAvgRating)} */}
            </div>
            <div
              className="mt-1.5 w-auto text-sm font-medium leading-5 text-muted-foreground"
              dir={langDir}
            >
              <p translate="no">
                {t("based_on_n_reviews", {
                  n: reviewsQuery.data?.data?.length,
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="w-auto">
          {activeProductPriceId && activeProductId && sellerId ? (
            <button
              type="button"
              onClick={handleToggleReviewModal}
              className="flex rounded-sm bg-dark-orange p-3 text-sm font-bold leading-5 text-white"
              translate="no"
            >
              <Image
                src="/images/pen-icon.svg"
                height={20}
                width={20}
                className="mr-2"
                alt="pen-icon"
              />
              <span>{t("write_a_review")}</span>
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex w-full items-center justify-end py-5">
        <ul className="flex items-center justify-end">
          <li className="ml-2 text-sm font-medium text-color-dark">Sort By:</li>
          <li className="ml-2">
            <Button
              variant={sortType === "newest" ? "secondary" : "ghost"}
              onClick={() => setSortType("newest")}
              className="block rounded-full border border-solid border-border px-2 text-sm font-medium text-muted-foreground"
              dir={langDir}
              translate="no"
            >
              {t("newest")}
            </Button>
          </li>
          <li className="ml-2">
            <Button
              variant={sortType === "highest" ? "secondary" : "ghost"}
              onClick={() => setSortType("highest")}
              className="block rounded-full border border-solid border-border px-2 text-sm font-medium text-muted-foreground"
              dir={langDir}
              translate="no"
            >
              {t("highest")}
            </Button>
          </li>
          <li className="ml-2">
            <Button
              variant={sortType === "lowest" ? "secondary" : "ghost"}
              onClick={() => setSortType("lowest")}
              className="block rounded-full border border-solid border-border px-2 text-sm font-medium text-muted-foreground"
              dir={langDir}
              translate="no"
            >
              {t("lowest")}
            </Button>
          </li>
        </ul>
      </div>
      <div className="flex w-full border-t-2 border-dashed border-border py-5">
        {!reviewsQuery?.data?.data?.length ? (
          <div
            className="w-full text-center text-sm font-bold text-dark-orange"
            dir={langDir}
            translate="no"
          >
            {t("no_reviews_found")}
          </div>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviewsQuery.data?.data?.length
            ? reviewsQuery.data?.data.map(
                (review: {
                  id: string;
                  rating: number;
                  title: string;
                  description: string;
                  createdAt: string;
                  productReview_product: {
                    productName: string;
                    productImages: {
                      imageName: string;
                      image: string;
                    }[];
                  };
                }) => (
                  <ProductReviewCard
                    key={review?.id}
                    rating={review?.rating}
                    productName={review?.productReview_product?.productName}
                    productImage={review?.productReview_product?.productImages}
                    title={review.title}
                    review={review.description}
                    // onEdit={() => {
                    //   setReviewId(review.id);
                    //   handleToggleReviewModal();
                    // }}
                    isEditable={!!activeProductId && !!activeProductPriceId}
                  />
                ),
              )
            : null}
        </div>
      </div>
      {/* <div className="flex w-full items-center justify-center text-center text-sm font-bold text-dark-orange">
        <span className="flex">
          <Image
            src="/images/loader.png"
            className="mr-1.5"
            height={20}
            width={20}
            alt="loader-icon"
          />
          Load More
        </span>
      </div> */}

      <Dialog open={isReviewModalOpen} onOpenChange={handleToggleReviewModal}>
        <DialogContent>
          <SellerReviewForm
            onClose={() => {
              setReviewId(undefined);
              handleToggleReviewModal();
            }}
            reviewId={reviewId}
            productPriceId={
              activeProductPriceId ? Number(activeProductPriceId) : 0
            }
            adminId={sellerId ? Number(sellerId) : 0}
            productId={activeProductId ? Number(activeProductId) : 0}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSection;
