"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Percent, Calculator } from "lucide-react";
import { useTranslations } from "next-intl";

interface PricingCalculatorProps {
  originalPrice: number | string | undefined;
  markup: number | string | undefined;
  onMarkupChange: (markup: number) => void;
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  originalPrice,
  markup,
  onMarkupChange
}) => {
  const t = useTranslations();
  
  // Ensure originalPrice is a valid number
  const safeOriginalPrice = Number(originalPrice) || 0;
  const safeMarkup = Number(markup) || 0;
  
  const finalPrice = safeOriginalPrice + safeMarkup;
  const markupPercentage = safeOriginalPrice > 0 ? (safeMarkup / safeOriginalPrice) * 100 : 0;
  const profitMargin = finalPrice > 0 ? (safeMarkup / finalPrice) * 100 : 0;

  const handleMarkupChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onMarkupChange(numValue);
  };

  const handlePercentageChange = (percentage: string) => {
    const numPercentage = parseFloat(percentage) || 0;
    const calculatedMarkup = ((Number(originalPrice) || 0) * numPercentage) / 100;
    onMarkupChange(calculatedMarkup);
  };

  return (
    <div className="space-y-6">
      {/* Price Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t("price_breakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Original Price */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("original_price")}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${safeOriginalPrice.toFixed(2)}
              </div>
            </div>

            {/* Markup */}
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {t("your_markup")}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary">
                ${safeMarkup.toFixed(2)}
              </div>
              <Badge variant="secondary" className="mt-1">
                {markupPercentage.toFixed(1)}%
              </Badge>
            </div>

            {/* Final Price */}
            <div className="text-center p-4 bg-success/5 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  {t("final_price")}
                </span>
              </div>
              <div className="text-2xl font-bold text-success">
                ${finalPrice.toFixed(2)}
              </div>
              <Badge variant="default" className="mt-1 bg-success">
                {profitMargin.toFixed(1)}% {t("profit_margin")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Markup Controls */}
      <Card>
        <CardHeader>
          <CardTitle>{t("set_your_markup")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dollar Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="markup-amount">
                {t("markup_amount")} ($)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="markup-amount"
                  type="number"
                  value={safeMarkup || 0}
                  onChange={(e) => handleMarkupChange(e.target.value)}
                  min="0"
                  step="0.01"
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Percentage Input */}
            <div className="space-y-2">
              <Label htmlFor="markup-percentage">
                {t("markup_percentage")} (%)
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="markup-percentage"
                  type="number"
                  value={markupPercentage || 0}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  min="0"
                  step="0.1"
                  className="pl-10"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          {/* Quick Markup Buttons */}
          <div className="space-y-2">
            <Label>{t("quick_markup_options")}</Label>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 30, 50, 100].map((percentage) => (
                <button
                  key={percentage}
                  type="button"
                  onClick={() => handlePercentageChange(percentage.toString())}
                  className="px-3 py-1 text-sm bg-muted hover:bg-muted rounded-md transition-colors"
                >
                  {percentage}%
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profit_analysis")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("profit_per_unit")}</span>
              <span className="font-semibold text-success">
                ${safeMarkup.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("profit_margin")}</span>
              <span className="font-semibold text-success">
                {profitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("markup_percentage")}</span>
              <span className="font-semibold text-primary">
                {markupPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("total_revenue_per_unit")}
                </span>
                <span className="text-lg font-bold text-foreground">
                  ${finalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingCalculator;
