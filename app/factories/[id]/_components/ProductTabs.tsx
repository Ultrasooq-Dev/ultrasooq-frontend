"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReviewSection from "@/components/shared/ReviewSection";
import QuestionsAnswersSection from "@/components/modules/productDetails/QuestionsAnswersSection";
import VendorSection from "@/components/modules/productDetails/VendorSection";
import RelatedServices from "@/components/modules/trending/RelatedServices";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import DescriptionTabContent from "./DescriptionTabContent";
import SpecificationTabContent from "./SpecificationTabContent";

const TAB_TRIGGER_CLASS =
  "relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold whitespace-nowrap text-muted-foreground transition-all duration-300 hover:border-b-gray-300 hover:bg-muted hover:text-foreground data-[state=active]:border-0 data-[state=active]:border-b-orange-500 data-[state=active]:bg-warning/5/30 data-[state=active]:font-bold data-[state=active]:text-warning sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg";

interface ProductTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  productDetails: any;
  searchParams: any;
  haveAccessToken: boolean;
  memoizedCartList: any[];
  me: any;
}

const ProductTabs: React.FC<ProductTabsProps> = ({
  activeTab,
  setActiveTab,
  productDetails,
  searchParams,
  haveAccessToken,
  memoizedCartList,
  me,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <Tabs onValueChange={(e) => setActiveTab(e)} value={activeTab}>
      <div className="bg-card">
        <TabsList className="flex w-full items-center justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="description" className={TAB_TRIGGER_CLASS} dir={langDir} translate="no">
            <span className="flex items-center gap-3">
              <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="hidden sm:inline">{t("description")}</span>
              <span className="sm:hidden">Desc</span>
            </span>
          </TabsTrigger>

          <TabsTrigger value="specification" className={TAB_TRIGGER_CLASS} dir={langDir} translate="no">
            <span className="flex items-center gap-3">
              <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="hidden sm:inline">{t("specification")}</span>
              <span className="sm:hidden">Spec</span>
            </span>
          </TabsTrigger>

          <TabsTrigger value="reviews" className={TAB_TRIGGER_CLASS} dir={langDir} translate="no">
            <span className="flex items-center gap-3">
              <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              <span className="hidden sm:inline">{t("reviews")}</span>
              <span className="sm:hidden">Reviews</span>
            </span>
          </TabsTrigger>

          <TabsTrigger value="qanda" className={TAB_TRIGGER_CLASS} dir={langDir} translate="no">
            <span className="flex items-center gap-3">
              <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="hidden sm:inline">{t("questions")}</span>
              <span className="sm:hidden">Q&A</span>
            </span>
          </TabsTrigger>

          <TabsTrigger value="vendor" className={TAB_TRIGGER_CLASS} dir={langDir} translate="no">
            <span className="flex items-center gap-3">
              <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="hidden sm:inline">{t("vendor")}</span>
              <span className="sm:hidden">Vendor</span>
            </span>
          </TabsTrigger>

          <TabsTrigger value="services" className={TAB_TRIGGER_CLASS} dir={langDir} translate="no">
            <span className="flex items-center gap-3">
              <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                />
              </svg>
              <span className="hidden sm:inline">{t("services")}</span>
              <span className="sm:hidden">Serv</span>
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="description" className="mt-0">
        <DescriptionTabContent productDetails={productDetails} />
      </TabsContent>

      <TabsContent value="specification" className="mt-0">
        <SpecificationTabContent productDetails={productDetails} />
      </TabsContent>

      <TabsContent value="reviews" className="mt-0">
        <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
              {t("customer_reviews")}
            </h2>
            <ReviewSection
              productId={searchParams?.id as string}
              hasAccessToken={haveAccessToken}
              productReview={productDetails?.productReview}
              isCreator={me?.data?.data?.id === productDetails?.adminId}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="qanda" className="mt-0">
        <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
          <QuestionsAnswersSection
            hasAccessToken={haveAccessToken}
            productId={searchParams?.id as string}
          />
        </div>
      </TabsContent>

      <TabsContent value="vendor" className="mt-0">
        <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
              {t("vendor_information")}
            </h2>
            <VendorSection adminId={productDetails?.product_productPrice?.[0]?.adminId} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="services" className="mt-0">
        <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
              {t("related_services")}
            </h2>
            <RelatedServices
              productId={Number(searchParams?.id) || 0}
              productPriceId={productDetails?.product_productPrice?.[0]?.id}
              productCategoryId={String(productDetails?.categoryId || "")}
              cartList={memoizedCartList}
              productCartId={
                memoizedCartList.find(
                  (item: any) => item.productId == Number(searchParams?.id),
                )?.id
              }
              isChildCart={
                !!memoizedCartList
                  ?.filter(
                    (c: any) => c.serviceId && c.cartProductServices?.length,
                  )
                  ?.find((c: any) => {
                    return !!c.cartProductServices.find(
                      (r: any) =>
                        r.relatedCartType == "PRODUCT" &&
                        r.productId == searchParams?.id,
                    );
                  })
              }
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ProductTabs;
