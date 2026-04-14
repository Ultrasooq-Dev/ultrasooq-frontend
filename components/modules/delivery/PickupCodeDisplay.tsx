"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { MapPin, Clock, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type PickupCodeDisplayProps = {
  code: string;
  status: string; // PENDING, COLLECTED, EXPIRED, CANCELLED
  qrPayload?: string;
  pickupWindowStart?: string | null;
  pickupWindowEnd?: string | null;
  expiresAt?: string | null;
};

const PickupCodeDisplay: React.FC<PickupCodeDisplayProps> = ({
  code,
  status,
  qrPayload,
  pickupWindowStart,
  pickupWindowEnd,
  expiresAt,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: t("copied"),
      variant: "success",
    });
  };

  // Calculate countdown
  const daysUntilExpiry = expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const statusColor = {
    PENDING: "bg-yellow-100 text-yellow-800",
    COLLECTED: "bg-green-100 text-green-800",
    EXPIRED: "bg-red-100 text-red-800",
    CANCELLED: "bg-muted text-foreground",
  }[status] || "bg-muted text-foreground";

  return (
    <Card dir={langDir}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t("pickup_code")}
          </span>
          <Badge className={statusColor}>{status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Large code display */}
        <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4">
          <span className="font-mono text-2xl font-bold tracking-widest">
            {code}
          </span>
          <button
            onClick={copyCode}
            className="rounded p-1 hover:bg-muted"
            title={t("copy")}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Pickup window */}
        {pickupWindowStart && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{t("pickup_window")}:</p>
            <p>
              {new Date(pickupWindowStart).toLocaleDateString()} -{" "}
              {pickupWindowEnd
                ? new Date(pickupWindowEnd).toLocaleDateString()
                : ""}
            </p>
          </div>
        )}

        {/* Expiry countdown */}
        {status === "PENDING" && daysUntilExpiry !== null && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {daysUntilExpiry > 0
              ? t("pickup_expires", { days: daysUntilExpiry })
              : t("pickup_expired")}
          </div>
        )}

        {/* Collected indicator */}
        {status === "COLLECTED" && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{t("pickup_collected")}</span>
          </div>
        )}

        {/* Instruction */}
        {status === "PENDING" && (
          <p className="text-xs text-muted-foreground">
            {t("show_code_at_store")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PickupCodeDisplay;
