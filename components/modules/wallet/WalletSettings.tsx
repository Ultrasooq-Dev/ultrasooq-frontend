"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWalletSettings, useUpdateWalletSettings } from "@/apis/queries/wallet.queries";
import { IWalletSettings } from "@/utils/types/wallet.types";

const WalletSettings: React.FC = () => {
  const t = useTranslations();
  const { currency } = useAuth();
  const { toast } = useToast();

  const { data: settingsData, isLoading } = useWalletSettings();
  const updateSettingsMutation = useUpdateWalletSettings();

  const [settings, setSettings] = useState<Partial<IWalletSettings>>({
    autoWithdraw: false,
    withdrawLimit: 0,
    dailyLimit: 0,
    monthlyLimit: 0,
    notificationPreferences: {},
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settingsData?.data) {
      setSettings(settingsData.data);
    }
  }, [settingsData]);

  const handleSettingChange = (field: keyof IWalletSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value,
      },
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync(settings);

      toast({
        title: t("settings_saved"),
        description: t("wallet_settings_updated_successfully"),
        variant: "success",
      });

      setIsDirty(false);
    } catch (error) {
      toast({
        title: t("save_failed"),
        description: t("unable_to_save_settings"),
        variant: "danger",
      });
    }
  };

  const handleReset = () => {
    if (settingsData?.data) {
      setSettings(settingsData.data);
      setIsDirty(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <h3 className="m-0 mb-4 text-[1.4rem] font-semibold text-foreground">{t("wallet_settings")}</h3>
        </div>
        <div className="space-y-5">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex items-center justify-between rounded-xl bg-muted border border-border p-6 animate-pulse">
              <div className="h-4 w-[60%] rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
              <div className="h-10 w-full max-w-[220px] rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h3 className="m-0 mb-4 text-[1.4rem] font-semibold text-foreground">{t("wallet_settings")}</h3>
        <p className="m-0 text-base text-muted-foreground">{t("manage_your_wallet_preferences")}</p>
      </div>

      <div>
        <div className="mb-8">
          <h4 className="mb-6 pb-3 border-b-2 border-gray-200 text-[1.2rem] font-semibold text-foreground">
            {t("withdrawal_settings")}
          </h4>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl bg-muted border border-border p-6 mb-5 transition-all hover:bg-gray-100 hover:-translate-y-px hover:shadow-[0_4px_15px_rgba(2,35,53,0.08)]">
            <div className="flex-1 mb-3 md:mb-0">
              <Label htmlFor="autoWithdraw" className="font-semibold text-foreground text-base mb-2">
                {t("auto_withdraw")}
              </Label>
              <span className="block text-sm text-muted-foreground">
                {t("automatically_withdraw_funds_description")}
              </span>
            </div>
            <Switch
              id="autoWithdraw"
              checked={settings.autoWithdraw || false}
              onCheckedChange={(checked) => handleSettingChange("autoWithdraw", checked)}
            />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl bg-muted border border-border p-6 mb-5 transition-all hover:bg-gray-100 hover:-translate-y-px hover:shadow-[0_4px_15px_rgba(2,35,53,0.08)]">
            <Label htmlFor="withdrawLimit" className="font-semibold text-foreground text-base mb-3 md:mb-0">
              {t("withdrawal_limit")} ({currency.symbol})
            </Label>
            <Input
              id="withdrawLimit"
              type="number"
              value={settings.withdrawLimit || ""}
              onChange={(e) => handleSettingChange("withdrawLimit", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full md:w-[220px]"
            />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl bg-muted border border-border p-6 mb-5 transition-all hover:bg-gray-100 hover:-translate-y-px hover:shadow-[0_4px_15px_rgba(2,35,53,0.08)]">
            <Label htmlFor="dailyLimit" className="font-semibold text-foreground text-base mb-3 md:mb-0">
              {t("daily_limit")} ({currency.symbol})
            </Label>
            <Input
              id="dailyLimit"
              type="number"
              value={settings.dailyLimit || ""}
              onChange={(e) => handleSettingChange("dailyLimit", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full md:w-[220px]"
            />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl bg-muted border border-border p-6 mb-5 transition-all hover:bg-gray-100 hover:-translate-y-px hover:shadow-[0_4px_15px_rgba(2,35,53,0.08)]">
            <Label htmlFor="monthlyLimit" className="font-semibold text-foreground text-base mb-3 md:mb-0">
              {t("monthly_limit")} ({currency.symbol})
            </Label>
            <Input
              id="monthlyLimit"
              type="number"
              value={settings.monthlyLimit || ""}
              onChange={(e) => handleSettingChange("monthlyLimit", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full md:w-[220px]"
            />
          </div>
        </div>

        <div className="mb-8">
          <h4 className="mb-6 pb-3 border-b-2 border-gray-200 text-[1.2rem] font-semibold text-foreground">
            {t("notifications")}
          </h4>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl bg-muted border border-border p-6 mb-5 transition-all hover:bg-gray-100 hover:-translate-y-px hover:shadow-[0_4px_15px_rgba(2,35,53,0.08)]">
            <div className="flex-1 mb-3 md:mb-0">
              <Label htmlFor="transactionNotifications" className="font-semibold text-foreground text-base mb-2">
                {t("transaction_notifications")}
              </Label>
              <span className="block text-sm text-muted-foreground">
                {t("receive_notifications_for_transactions")}
              </span>
            </div>
            <Switch
              id="transactionNotifications"
              checked={settings.notificationPreferences?.transactions || false}
              onCheckedChange={(checked) => handleNotificationChange("transactions", checked)}
            />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl bg-muted border border-border p-6 mb-5 transition-all hover:bg-gray-100 hover:-translate-y-px hover:shadow-[0_4px_15px_rgba(2,35,53,0.08)]">
            <div className="flex-1 mb-3 md:mb-0">
              <Label htmlFor="lowBalanceNotifications" className="font-semibold text-foreground text-base mb-2">
                {t("low_balance_notifications")}
              </Label>
              <span className="block text-sm text-muted-foreground">
                {t("receive_notifications_when_balance_is_low")}
              </span>
            </div>
            <Switch
              id="lowBalanceNotifications"
              checked={settings.notificationPreferences?.lowBalance || false}
              onCheckedChange={(checked) => handleNotificationChange("lowBalance", checked)}
            />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl bg-muted border border-border p-6 mb-5 transition-all hover:bg-gray-100 hover:-translate-y-px hover:shadow-[0_4px_15px_rgba(2,35,53,0.08)]">
            <div className="flex-1 mb-3 md:mb-0">
              <Label htmlFor="withdrawalNotifications" className="font-semibold text-foreground text-base mb-2">
                {t("withdrawal_notifications")}
              </Label>
              <span className="block text-sm text-muted-foreground">
                {t("receive_notifications_for_withdrawals")}
              </span>
            </div>
            <Switch
              id="withdrawalNotifications"
              checked={settings.notificationPreferences?.withdrawals || false}
              onCheckedChange={(checked) => handleNotificationChange("withdrawals", checked)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-5 justify-end pt-6 border-t-2 border-gray-200">
        <Button
          onClick={handleReset}
          variant="outline"
          disabled={!isDirty || updateSettingsMutation.isPending}
        >
          {t("reset")}
        </Button>

        <Button
          onClick={handleSave}
          disabled={!isDirty || updateSettingsMutation.isPending}
          className="bg-[var(--brand-dark)] text-[var(--card)] shadow-[0_4px_15px_rgba(2,35,53,0.3)] hover:bg-[var(--brand-info)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(2,35,53,0.4)]"
        >
          {updateSettingsMutation.isPending ? t("saving") : t("save_settings")}
        </Button>
      </div>
    </div>
  );
};

export default WalletSettings;
