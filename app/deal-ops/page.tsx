"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { DealOpsTab } from "@/components/modules/deals/DealOpsTab";
import { cn } from "@/lib/utils";
import { HandshakeIcon } from "lucide-react";

function DealOpsPage() {
  const { langDir } = useAuth();
  const t = useTranslations();

  return (
    <>
      <title dir={langDir} translate="no">{`${t("deal_ops") || "Deal Ops"} | Ultrasooq`}</title>
      <div className="min-h-screen bg-[#faf6f1]">
        <div className="w-full px-6 lg:px-12 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-[#c2703e]/10">
                <HandshakeIcon className="h-6 w-6 text-[#c2703e]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#2d2017]" dir={langDir}>
                  {t("deal_ops") || "Deal Ops"}
                </h1>
                <p className="text-[#8a7560]">
                  Manage all your deals — BuyGroup, Dropship, Service & Retail
                </p>
              </div>
            </div>
          </div>

          {/* Deal Ops Content */}
          <DealOpsTab langDir={langDir} t={t} />
        </div>
      </div>
    </>
  );
}

export default withActiveUserGuard(DealOpsPage);
