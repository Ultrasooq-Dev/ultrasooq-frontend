"use client";
import React, { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

import WizardStepper from "./WizardStepper";
import AiCategorizationOverlay from "./AiCategorizationOverlay";
import Step1NameAndPictures from "./Step1NameAndPictures";
import Step2ProductDetails from "./Step2ProductDetails";
import Step3VendorDetails from "./Step3VendorDetails";
import { useWizardForm } from "./useWizardForm";
import { useAiCategorization } from "./useAiCategorization";
import { populateFormWithAIData } from "./populateFormWithAIData";
import {
  STEP_1_VALIDATE_FIELDS,
  STEP_2_VALIDATE_FIELDS,
  STEP_3_VALIDATE_FIELDS,
} from "./wizardSchemas";
import type { WizardStep } from "./wizardTypes";

interface ProductWizardProps {
  form: UseFormReturn<any>;
  tagsList: any;
  activeProductType?: string;
  selectedCategoryIds?: string[];
  setSelectedCategoryIds?: (ids: string[]) => void;
  isEditMode: boolean;
  copy?: boolean;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

const ProductWizard: React.FC<ProductWizardProps> = ({
  form,
  tagsList,
  activeProductType,
  selectedCategoryIds,
  setSelectedCategoryIds,
  isEditMode,
  copy = false,
  isSubmitting = false,
  onSubmit,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();

  // Callback: when user selects AI-generated data in Step 1
  const handleAiProductDataReady = useCallback(
    async (aiData: any) => {
      await populateFormWithAIData(form, aiData, setSelectedCategoryIds);
      toast({
        title: t("product_data_loaded"),
        description: t("ai_data_loaded_successfully"),
      });
    },
    [form, setSelectedCategoryIds, toast, t],
  );

  // AI categorization hook
  const {
    categorize,
    status: aiStatus,
    isOverlayVisible,
  } = useAiCategorization({
    form,
    setSelectedCategoryIds,
  });

  // Wizard navigation hook
  const {
    currentStep,
    completedSteps,
    goNext,
    goBack,
    goToStep,
    onStepClick,
  } = useWizardForm({
    form,
    isEditMode,
    onAiCategorize: categorize,
  });

  return (
    <div className="space-y-6">
      {/* AI Categorization Overlay */}
      <AiCategorizationOverlay
        isVisible={isOverlayVisible}
        status={aiStatus === "idle" ? "analyzing" : aiStatus}
      />

      {/* Wizard Stepper */}
      <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
        <WizardStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={onStepClick}
        />
      </div>

      {/* Step Content — all steps stay in DOM, only active one is visible */}

      {/* Step 1: Name & Pictures + AI Product Search */}
      <div className={cn(currentStep !== 1 && "hidden")}>
        <Step1NameAndPictures
          copy={copy}
          onAiProductDataReady={handleAiProductDataReady}
        />
      </div>

      {/* Step 2: Product Details & Specs */}
      <div className={cn(currentStep !== 2 && "hidden")}>
        <Step2ProductDetails
          tagsList={tagsList}
          activeProductType={activeProductType}
          selectedCategoryIds={selectedCategoryIds}
          copy={copy}
        />
      </div>

      {/* Step 3: Vendor Details */}
      <div className={cn(currentStep !== 3 && "hidden")}>
        <Step3VendorDetails activeProductType={activeProductType} />
      </div>

      {/* Navigation Buttons */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                className="gap-2 rounded-xl border-border px-6 py-3 text-muted-foreground hover:bg-muted"
                dir={langDir}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </Button>
            )}
          </div>

          {/* Next / Submit button */}
          <div className="flex items-center gap-3">
            {/* Skip hint on Step 1 */}
            {currentStep === 1 && (
              <span className="text-xs text-muted-foreground">
                {t("skip_ai_hint")}
              </span>
            )}
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={goNext}
                className="gap-2 rounded-xl bg-warning px-8 py-3 font-medium text-white shadow-lg shadow-orange-200 hover:bg-warning"
                dir={langDir}
              >
                {t("next")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={async (e) => {
                  // Validate all fields first and show toast if there are errors
                  const isValid = await form.trigger();
                  if (!isValid) {
                    e.preventDefault();

                    // Detect which step has the first error and navigate there
                    const errorKeys = Object.keys(form.formState.errors);

                    const stepFieldMap: { step: WizardStep; fields: string[]; label: string }[] = [
                      { step: 1, fields: STEP_1_VALIDATE_FIELDS, label: t("wizard_step_product_info") },
                      { step: 2, fields: STEP_2_VALIDATE_FIELDS, label: t("wizard_step_details_specs") },
                      { step: 3, fields: STEP_3_VALIDATE_FIELDS, label: t("wizard_step_vendor_details") },
                    ];

                    const errorStep = stepFieldMap.find(({ fields }) =>
                      errorKeys.some((key) => fields.some((f) => key === f || key.startsWith(f + ".")))
                    );

                    if (errorStep && errorStep.step !== currentStep) {
                      goToStep(errorStep.step);
                      toast({
                        title: t("validation_error"),
                        description: `${t("please_fill_required_fields")} — ${errorStep.label} (${t("step")} ${errorStep.step})`,
                        variant: "danger",
                      });
                    } else {
                      toast({
                        title: t("validation_error"),
                        description: t("please_fill_required_fields"),
                        variant: "danger",
                      });
                    }
                    return;
                  }
                }}
                className="gap-2 rounded-xl bg-warning px-8 py-3 font-medium text-white shadow-lg shadow-orange-200 hover:bg-warning disabled:opacity-50"
                dir={langDir}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : isEditMode ? (
                  <>
                    <Send className="h-4 w-4" />
                    {t("update_product")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("submit")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductWizard;
