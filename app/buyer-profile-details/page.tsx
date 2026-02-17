"use client";
import { useMe, useUpdateProfile } from "@/apis/queries/user.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import React, { useState } from "react";
import Image from "next/image";
import ProfileCard from "@/components/modules/buyerProfileDetails/ProfileCard";
import InformationSection from "@/components/modules/freelancerProfileDetails/InformationSection";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Footer from "@/components/shared/Footer";
import { Dialog } from "@/components/ui/dialog";
import TradeRoleUpgradeContent from "@/components/modules/buyerProfileDetails/TradleRoleUpgradeContent";
import ConfirmContent from "@/components/shared/ConfirmContent";
import { useToast } from "@/components/ui/use-toast";
import BackgroundImage from "@/public/images/before-login-bg.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const BuyerProfileDetailsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [role, setRole] = useState<"COMPANY" | "FREELANCER">();
  const handleRoleModal = () => setIsRoleModalOpen(!isRoleModalOpen);
  const handleConfirmModal = () => {
    setIsConfirmModalOpen(!isConfirmModalOpen);
    setIsRoleModalOpen(false);
    setRole(undefined);
  };

  const me = useMe();
  const currentAccount = useCurrentAccount();
  const updateProfile = useUpdateProfile();
  const handleTradeRole = (role: "COMPANY" | "FREELANCER") => setRole(role);

  // Get the current account data
  const currentAccountData = currentAccount?.data?.data?.account;
  const currentTradeRole = currentAccountData?.tradeRole;

  // Redirect if user is not on a BUYER account
  React.useEffect(() => {
    if (currentTradeRole && currentTradeRole !== 'BUYER') {
      if (currentTradeRole === 'FREELANCER') {
        router.replace("/freelancer-profile");
      } else if (currentTradeRole === 'COMPANY') {
        router.replace("/company-profile");
      }
    }
  }, [currentTradeRole, router]);

  // Show loading while account data is being fetched
  if (currentAccount.isLoading || !currentTradeRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading account information...</p>
        </div>
      </div>
    );
  }

  const onSubmit = async () => {
    if (!role) return;

    const data: { tradeRole: string } = {
      tradeRole: role,
    };

    const response = await updateProfile.mutateAsync(data);
    if (response.status && response.data) {
      toast({
        title: t("trade_role_update_successful"),
        description: response.message,
        variant: "success",
      });
      setIsConfirmModalOpen(false);
      setIsRoleModalOpen(false);
      setRole(undefined);
      if (response.data.tradeRole === "FREELANCER") {
        router.replace("/freelancer-profile");
      } else if (response.data.tradeRole === "COMPANY") {
        router.replace("/company-profile");
      }
    } else {
      setIsConfirmModalOpen(false);
      setIsRoleModalOpen(false);
      setRole(undefined);
      toast({
        title: t("trade_role_update_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

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
                className="text-2xl font-semibold leading-10 text-color-dark md:text-4xl"
                dir={langDir}
                translate="no"
              >
                {t("my_profile")}
              </h2>
            </div>
            <ProfileCard userDetails={currentAccountData || me.data?.data} />
            <div className="mt-12 w-full">
              <Tabs defaultValue="profile-info">
                <TabsList className="mb-1 grid min-h-[80px] w-[560px] max-w-full grid-cols-3 gap-x-6 rounded-none bg-transparent px-0 pt-7">
                  <TabsTrigger
                    value="profile-info"
                    className="rounded-b-none bg-[#d1d5db]! py-4 text-base font-bold text-[#71717A]! data-[state=active]:bg-dark-orange! data-[state=active]:text-white!"
                    dir={langDir}
                    translate="no"
                  >
                    {t("profile_info")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile-info" className="mt-0">
                  <div className="w-full rounded-b-3xl border border-solid border-gray-300 bg-white p-4 shadow-md sm:px-6 sm:pb-4 sm:pt-8 md:px-9 md:pb-7 md:pt-12">
                    <InformationSection userDetails={currentAccountData || me.data?.data} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <Dialog open={isRoleModalOpen} onOpenChange={handleRoleModal}>
          <TradeRoleUpgradeContent
            onClose={() => {
              setIsRoleModalOpen(false);
              setRole(undefined);
            }}
            onConfirmRole={(value) => {
              handleTradeRole(value);
              setIsConfirmModalOpen(true);
            }}
          />
        </Dialog>

        <Dialog open={isConfirmModalOpen} onOpenChange={handleConfirmModal}>
          <ConfirmContent
            onClose={() => {
              setIsRoleModalOpen(false);
              setIsConfirmModalOpen(false);
              setRole(undefined);
            }}
            onConfirm={() => onSubmit()}
            isLoading={updateProfile.isPending}
            description="change role"
          />
        </Dialog>
      </section>

      <Footer />
    </>
  );
};

export default BuyerProfileDetailsPage;
