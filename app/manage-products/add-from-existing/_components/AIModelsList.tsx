"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ProductModel } from "./addFromExistingTypes";

interface AIModelsListProps {
  models: ProductModel[];
  checkingModel: boolean;
  processingProductIndex: number | null;
  langDir: string;
  onSelectModel: (model: string | ProductModel) => void;
}

export const AIModelsList: React.FC<AIModelsListProps> = ({
  models,
  checkingModel,
  processingProductIndex,
  langDir,
  onSelectModel,
}) => {
  const t = useTranslations();

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {models.map((model, idx) => {
        const modelName =
          typeof model === "string" ? model : model.modelName;
        const specifications =
          typeof model === "string" ? "" : model.specifications;

        return (
          <div
            key={idx}
            className="bg-card border border-border rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {specifications ? (
                  <div
                    className="text-sm text-muted-foreground"
                    dir={langDir}
                  >
                    <span className="font-semibold text-foreground">
                      {modelName}
                    </span>
                    <span className="text-muted-foreground mx-1">-</span>
                    <span className="text-muted-foreground">
                      {specifications
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((spec) => {
                          const colonIndex = spec.indexOf(":");
                          if (colonIndex > 0) {
                            return spec.substring(colonIndex + 1).trim();
                          }
                          return spec.trim();
                        })
                        .filter((value) => value.length > 0)
                        .join(", ")}
                    </span>
                  </div>
                ) : (
                  <h5
                    className="font-semibold text-foreground"
                    dir={langDir}
                  >
                    {modelName}
                  </h5>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => onSelectModel(model)}
                disabled={checkingModel || processingProductIndex === idx}
                className="bg-info hover:bg-info/90 text-white flex-shrink-0 ml-4"
              >
                {checkingModel && processingProductIndex === idx ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("checking_and_generating") || "Checking & Generating..."}
                  </>
                ) : (
                  t("select") || "Select"
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
