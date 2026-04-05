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
      <div className="wallet_settings">
        <div className="settings_header">
          <h3>{t("wallet_settings")}</h3>
        </div>
        <div className="loading_skeleton">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="setting_item skeleton">
              <div className="skeleton skeleton_text"></div>
              <div className="skeleton skeleton_input"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="wallet_settings">
      <div className="settings_header">
        <h3>{t("wallet_settings")}</h3>
        <p>{t("manage_your_wallet_preferences")}</p>
      </div>

      <div className="settings_content">
        <div className="settings_section">
          <h4>{t("withdrawal_settings")}</h4>
          
          <div className="setting_item">
            <div className="setting_label">
              <Label htmlFor="autoWithdraw">{t("auto_withdraw")}</Label>
              <span className="setting_description">
                {t("automatically_withdraw_funds_description")}
              </span>
            </div>
            <Switch
              id="autoWithdraw"
              checked={settings.autoWithdraw || false}
              onCheckedChange={(checked) => handleSettingChange("autoWithdraw", checked)}
            />
          </div>

          <div className="setting_item">
            <Label htmlFor="withdrawLimit">{t("withdrawal_limit")} ({currency.symbol})</Label>
            <Input
              id="withdrawLimit"
              type="number"
              value={settings.withdrawLimit || ""}
              onChange={(e) => handleSettingChange("withdrawLimit", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="setting_item">
            <Label htmlFor="dailyLimit">{t("daily_limit")} ({currency.symbol})</Label>
            <Input
              id="dailyLimit"
              type="number"
              value={settings.dailyLimit || ""}
              onChange={(e) => handleSettingChange("dailyLimit", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="setting_item">
            <Label htmlFor="monthlyLimit">{t("monthly_limit")} ({currency.symbol})</Label>
            <Input
              id="monthlyLimit"
              type="number"
              value={settings.monthlyLimit || ""}
              onChange={(e) => handleSettingChange("monthlyLimit", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="settings_section">
          <h4>{t("notifications")}</h4>
          
          <div className="setting_item">
            <div className="setting_label">
              <Label htmlFor="transactionNotifications">{t("transaction_notifications")}</Label>
              <span className="setting_description">
                {t("receive_notifications_for_transactions")}
              </span>
            </div>
            <Switch
              id="transactionNotifications"
              checked={settings.notificationPreferences?.transactions || false}
              onCheckedChange={(checked) => handleNotificationChange("transactions", checked)}
            />
          </div>

          <div className="setting_item">
            <div className="setting_label">
              <Label htmlFor="lowBalanceNotifications">{t("low_balance_notifications")}</Label>
              <span className="setting_description">
                {t("receive_notifications_when_balance_is_low")}
              </span>
            </div>
            <Switch
              id="lowBalanceNotifications"
              checked={settings.notificationPreferences?.lowBalance || false}
              onCheckedChange={(checked) => handleNotificationChange("lowBalance", checked)}
            />
          </div>

          <div className="setting_item">
            <div className="setting_label">
              <Label htmlFor="withdrawalNotifications">{t("withdrawal_notifications")}</Label>
              <span className="setting_description">
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

      <div className="settings_actions">
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
          className="save_btn"
        >
          {updateSettingsMutation.isPending ? t("saving") : t("save_settings")}
        </Button>
      </div>
    </div>
  );
};

export default WalletSettings;
