"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { ScanLine, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type PickupVerificationProps = {
  orderProductId: number;
  onVerify: (code: string) => Promise<boolean>;
  isLoading?: boolean;
};

const PickupVerification: React.FC<PickupVerificationProps> = ({
  orderProductId,
  onVerify,
  isLoading = false,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;

    const success = await onVerify(code.trim().toUpperCase());
    if (success) {
      setVerified(true);
      toast({
        title: t("pickup_verified"),
        variant: "success",
      });
    } else {
      toast({
        title: t("invalid_pickup_code"),
        variant: "danger",
      });
    }
  };

  if (verified) {
    return (
      <Card dir={langDir}>
        <CardContent className="flex items-center justify-center gap-2 py-6">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <span className="font-medium text-green-700">{t("pickup_verified")}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir={langDir}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ScanLine className="h-4 w-4" />
          {t("verify_pickup")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder={t("enter_pickup_code")}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="font-mono text-center text-lg tracking-widest"
            dir="ltr"
          />
          <Button
            onClick={handleVerify}
            disabled={!code.trim() || isLoading}
          >
            {isLoading ? t("loading") : t("verify")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PickupVerification;
