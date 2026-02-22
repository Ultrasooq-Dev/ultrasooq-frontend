"use client";
import { useMe } from "@/apis/queries/user.queries";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import ProfileCard from "@/components/modules/freelancerProfileDetails/ProfileCard";
import InformationSection from "@/components/modules/freelancerProfileDetails/InformationSection";
import ReviewSection from "@/components/modules/freelancerProfileDetails/ReviewSection";
import MoreInformationSection from "@/components/modules/freelancerProfileDetails/MoreInformationSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsSection from "@/components/modules/freelancerProfileDetails/ProductsSection";
import { PlusIcon } from "@radix-ui/react-icons";
import Footer from "@/components/shared/Footer";
import { useVendorDetails } from "@/apis/queries/product.queries";
import VendorCard from "@/components/modules/companyProfileDetails/VendorCard";
import VendorInformationSection from "@/components/modules/freelancerProfileDetails/VendorInformationSection";
import VendorMoreInformationSection from "@/components/modules/freelancerProfileDetails/VendorMoreInformationSection";
import BackgroundImage from "@/public/images/before-login-bg.png";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

export default function FreelancerProfileDetailsPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [activeTab, setActiveTab] = useState("profile-info");

  const me = useMe();
  const [activeSellerId, setActiveSellerId] = useState<string | null>();

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

  return (
    <>
      <section className="relative w-full py-7">
        <div className="absolute left-0 top-0 -z-10 h-full w-full">
          <Image
            src={BackgroundImage}
            className="h-full w-full object-cover object-center"
            alt="background"
            fill
            priority
          />
        </div>
        <div className="container relative z-10 m-auto px-3">
          <div className="flex flex-wrap">
            <div className="mb-7 w-full">
              <h2
                className="text-4xl font-semibold leading-10 text-color-dark"
                dir={langDir}
                translate="no"
              >
                {t("my_profile")}
              </h2>
            </div>

            {!activeSellerId ? (
              <ProfileCard userDetails={me.data?.data} />
            ) : null}

            {/* importing from company module */}
            {activeSellerId ? (
              <VendorCard vendor={vendor} isLoading={vendorQuery.isLoading} />
            ) : null}

            <div className="mt-12 w-full">
              <Tabs onValueChange={(e) => setActiveTab(e)} value={activeTab}>
                <TabsList className="flex h-auto min-h-[80px] w-full grid-cols-3 flex-wrap gap-3 rounded-none bg-transparent px-0 pt-7 md:mb-1 md:grid md:w-[560px] md:gap-6">
                  <TabsTrigger
                    value="profile-info"
                    className="rounded-b-none bg-[#d1d5db]! py-4 text-base font-bold text-[#71717A]! data-[state=active]:bg-dark-orange! data-[state=active]:text-white!"
                    dir={langDir}
                    translate="no"
                  >
                    {t("profile_info")}
                  </TabsTrigger>

                  <TabsTrigger
                    value="ratings"
                    className="rounded-b-none bg-[#d1d5db]! py-4 text-base font-bold text-[#71717A]! data-[state=active]:bg-dark-orange! data-[state=active]:text-white!"
                    dir={langDir}
                    translate="no"
                  >
                    {t("ratings_n_reviews")}
                  </TabsTrigger>

                  <TabsTrigger
                    value="products"
                    className="rounded-b-none bg-[#d1d5db]! py-4 text-base font-bold text-[#71717A]! data-[state=active]:bg-dark-orange! data-[state=active]:text-white!"
                    dir={langDir}
                    translate="no"
                  >
                    {t("products")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile-info" className="mt-0">
                  <div className="w-full rounded-b-3xl border border-solid border-border bg-card p-4 shadow-md sm:px-6 sm:pb-4 sm:pt-8 md:px-9 md:pb-7 md:pt-12">
                    {!activeSellerId ? (
                      <InformationSection userDetails={me.data?.data} />
                    ) : null}

                    {activeSellerId ? (
                      <VendorInformationSection vendor={vendor} />
                    ) : null}

                    {!me.data?.data?.userBranch?.length ? (
                      <>
                        <p
                          className="pt-5 text-center text-lg font-medium text-color-dark"
                          dir={langDir}
                          translate="no"
                        >
                          {t("no_branch_exists")}
                        </p>
                        {!activeSellerId ? (
                          <div className="mb-5 flex w-full items-center justify-end pt-4">
                            <Link
                              href="/freelancer-profile"
                              className="flex items-center rounded-md border-0 bg-dark-orange px-3 py-2 text-sm font-medium capitalize leading-6 text-white"
                              dir={langDir}
                              translate="no"
                            >
                              <PlusIcon className="mr-1 h-5 w-5" />
                              {t("add")}
                            </Link>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {!activeSellerId && me?.data?.data?.userBranch?.length ? (
                      <MoreInformationSection userDetails={me.data?.data} />
                    ) : null}

                    {activeSellerId && me?.data?.data?.userBranch?.length ? (
                      <VendorMoreInformationSection vendor={vendor} />
                    ) : null}
                  </div>
                </TabsContent>
                <TabsContent value="ratings" className="mt-0">
                  <div className="w-full rounded-b-3xl border border-solid border-border bg-card p-4 shadow-md sm:px-6 sm:pb-4 sm:pt-8 md:px-9 md:pb-7 md:pt-12">
                    <ReviewSection
                      sellerId={
                        activeSellerId
                          ? (activeSellerId as string)
                          : me.data?.data?.id
                      }
                    />
                  </div>
                </TabsContent>
                <TabsContent value="products" className="mt-0">
                  <div className="w-full rounded-b-3xl border border-solid border-border bg-card p-4 shadow-md sm:px-6 sm:pb-4 sm:pt-8 md:px-9 md:pb-7 md:pt-12">
                    <ProductsSection sellerId={activeSellerId as string} />
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
