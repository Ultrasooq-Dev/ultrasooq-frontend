"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type PickupWindowPickerProps = {
  orderProductId: number;
  currentStart?: string | null;
  currentEnd?: string | null;
  onSave: (start: string, end: string) => Promise<void>;
  isLoading?: boolean;
};

const PickupWindowPicker: React.FC<PickupWindowPickerProps> = ({
  orderProductId,
  currentStart,
  currentEnd,
  onSave,
  isLoading = false,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(
    currentStart ? new Date(currentStart).toISOString().slice(0, 16) : ""
  );
  const [endDate, setEndDate] = useState(
    currentEnd ? new Date(currentEnd).toISOString().slice(0, 16) : ""
  );

  const handleSave = async () => {
    if (!startDate || !endDate) {
      toast({
        title: t("pickup_window_required"),
        variant: "danger",
      });
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast({
        title: t("end_date_must_be_after_start"),
        variant: "danger",
      });
      return;
    }

    await onSave(startDate, endDate);
    toast({
      title: t("pickup_window_set"),
      variant: "success",
    });
  };

  return (
    <Card dir={langDir}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t("set_pickup_window")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">{t("start_date_time")}</Label>
          <Input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("end_date_time")}</Label>
          <Input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            dir="ltr"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading || !startDate || !endDate}
          className="w-full"
          size="sm"
        >
          <Clock className="h-4 w-4 me-1" />
          {isLoading ? t("loading") : t("save_pickup_window")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PickupWindowPicker;
