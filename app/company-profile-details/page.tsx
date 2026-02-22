"use client";
import { useMe } from "@/apis/queries/user.queries";
import BranchSection from "@/components/modules/companyProfileDetails/BranchSection";
import InformationSection from "@/components/modules/companyProfileDetails/InformationSection";
import MoreInformationSection from "@/components/modules/companyProfileDetails/MoreInformationSection";
import ProfileCard from "@/components/modules/companyProfileDetails/ProfileCard";
import ReviewSection from "@/components/modules/freelancerProfileDetails/ReviewSection";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon } from "@radix-ui/react-icons";
import ProductsSection from "@/components/modules/freelancerProfileDetails/ProductsSection";
import Footer from "@/components/shared/Footer";

import { useVendorDetails } from "@/apis/queries/product.queries";
import VendorCard from "@/components/modules/companyProfileDetails/VendorCard";
import VendorBranchSection from "@/components/modules/companyProfileDetails/VendorBranchSection";
import VendorInformationSection from "@/components/modules/companyProfileDetails/VendorInformationSection";
import VendorMoreInformationSection from "@/components/modules/companyProfileDetails/VendorMoreInfomationSection";
import BackgroundImage from "@/public/images/before-login-bg.png";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

export default function CompanyProfileDetailsPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [activeTab, setActiveTab] = useState("profile-info");
  const [activeSellerId, setActiveSellerId] = useState<string | null>();

  const me = useMe();
  


  const vendorQuery = useVendorDetails(
    {
      adminId: activeSellerId || "",
    },
    !!activeSellerId,
  );

  const vendor = vendorQuery.data?.data;

  useEffect(() => {
    const params = new URLSearchParams(document.location.search);
    let sellerId = params.get("userId");
    let type = params.get("type");

    setActiveSellerId(sellerId);
    setActiveTab(type || "profile-info");
  }, []);

  // Debug log to see what data we're getting
  useEffect(() => {
    if (me.data?.data) {
    }
  }, [me.data]);

  return (
    <>
      <section className="relative w-full py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-primary/5 via-white to-info/5">
        <div className="absolute left-0 top-0 -z-10 h-full w-full opacity-30">
          <Image
            src={BackgroundImage}
            className="h-full w-full object-cover object-center"
            alt="background"
            fill
            priority
            sizes="(100vw, 100vh)"
          />
        </div>
        <div className="container relative z-10 m-auto px-3 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-wrap">
            <div className="mb-6 sm:mb-8 lg:mb-10 w-full">
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900"
                dir={langDir}
                translate="no"
              >
                {t("my_profile")}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                {t("manage_your_profile_information")}
              </p>
            </div>

            {!activeSellerId ? (
              <ProfileCard userDetails={me.data?.data} />
            ) : null}

            {activeSellerId ? (
              <VendorCard vendor={vendor} isLoading={vendorQuery.isLoading} />
            ) : null}

            <div className="mt-8 sm:mt-10 lg:mt-12 w-full">
              <Tabs
                onValueChange={(e) => setActiveTab(e)}
                value={activeTab}
                // @ts-ignore
                dir={langDir}
              >
                <TabsList className="mb-0 flex h-auto grid-cols-3 flex-wrap justify-start gap-3 sm:gap-4 rounded-none bg-transparent px-0 pt-0 sm:mb-2">
                  <TabsTrigger
                    value="profile-info"
                    className="w-auto sm:w-auto md:w-[180px] lg:w-[200px] rounded-t-xl rounded-b-none bg-gray-200 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-gray-700 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white"
                    translate="no"
                  >
                    {t("profile_info")}
                  </TabsTrigger>

                  <TabsTrigger
                    value="ratings"
                    className="w-auto sm:w-auto md:w-[180px] lg:w-[200px] rounded-t-xl rounded-b-none bg-gray-200 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-gray-700 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white"
                    translate="no"
                  >
                    {t("ratings_n_reviews")}
                  </TabsTrigger>

                  <TabsTrigger
                    value="products"
                    className="w-auto sm:w-auto md:w-[180px] lg:w-[200px] rounded-t-xl rounded-b-none bg-gray-200 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-gray-700 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white"
                    translate="no"
                  >
                    {t("products")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile-info" className="mt-0">
                  <div className="w-full rounded-b-3xl rounded-tr-3xl border-2 border-primary/10 bg-white px-4 py-6 sm:px-8 sm:py-10 md:px-12 md:py-14">
                    {/* Company Information Section */}
                    {!activeSellerId ? (
                      <InformationSection userDetails={me.data?.data} />
                    ) : null}

                    {activeSellerId ? (
                      <VendorInformationSection vendor={vendor} />
                    ) : null}

                    {/* More Information Section */}
                    {!activeSellerId && me.data?.data?.userProfile?.[0] ? (
                      <MoreInformationSection userDetails={me.data?.data} />
                    ) : null}

                    {activeSellerId && vendor?.userProfile?.[0] ? (
                      <VendorMoreInformationSection vendor={vendor} />
                    ) : null}

                    {/* Branch Section */}
                    <div className="mb-6 w-full pt-8 border-t-2 border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                          {t("branches")}
                        </h3>
                        {/* Add button */}
                        {!activeSellerId ? (
                          <Link
                            href="/company-profile/add-branch"
                            className="flex items-center gap-2 rounded-xl border-0 bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200"
                            dir={langDir}
                            translate="no"
                          >
                            <PlusIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">{t("add_branch")}</span>
                            <span className="sm:hidden">{t("add")}</span>
                          </Link>
                        ) : null}
                      </div>

                      {/* Show "No Branch Exists" message if no branches */}
                      {!activeSellerId && (!me.data?.data?.userBranch || me.data?.data?.userBranch?.length === 0) ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                          <div className="max-w-sm mx-auto">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <p
                              className="text-lg sm:text-xl font-semibold text-gray-700 mb-2"
                              dir={langDir}
                              translate="no"
                            >
                              {t("no_branch_exists")}
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              {t("add_your_first_branch_to_get_started")}
                            </p>
                            <Link
                              href="/company-profile/add-branch"
                              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all duration-200"
                            >
                              <PlusIcon className="h-5 w-5" />
                              {t("add_branch")}
                            </Link>
                          </div>
                        </div>
                      ) : null}
                      
                      {/* Display branches if they exist */}
                      {!activeSellerId && me.data?.data?.userBranch && me.data?.data?.userBranch?.length > 0
                        ? me.data?.data?.userBranch
                            .sort(
                              (a: any, b: any) => b?.mainOffice - a?.mainOffice,
                            )
                            .map((item: any) => (
                              <React.Fragment key={item.id}>
                                <BranchSection branchDetails={item} />
                              </React.Fragment>
                            ))
                        : null}

                      {activeSellerId
                        ? vendor?.userBranch
                            .sort(
                              (a: any, b: any) => b?.mainOffice - a?.mainOffice,
                            )
                            .map((item: any) => (
                              <React.Fragment key={item.id}>
                                <VendorBranchSection branchDetails={item} />
                              </React.Fragment>
                            ))
                        : null}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="ratings" className="mt-0">
                  <div className="w-full rounded-b-3xl rounded-tr-3xl border-2 border-primary/10 bg-white px-4 py-6 sm:px-8 sm:py-10 md:px-12 md:py-14">
                    {/* importing from freelancer details module */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t("ratings_n_reviews")}</h3>
                          <p className="text-sm text-gray-600">{t("see_what_others_are_saying")}</p>
                        </div>
                      </div>
                      <ReviewSection
                        sellerId={
                          activeSellerId
                            ? (activeSellerId as string)
                            : me.data?.data?.id
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="products" className="mt-0">
                  <div className="w-full rounded-b-3xl rounded-tr-3xl border-2 border-primary/10 bg-white px-4 py-6 sm:px-8 sm:py-10 md:px-12 md:py-14">
                    {/* importing from freelancer details module */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t("products")}</h3>
                          <p className="text-sm text-gray-600">{t("browse_our_product_catalog")}</p>
                        </div>
                      </div>
                      <ProductsSection sellerId={activeSellerId as string} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
