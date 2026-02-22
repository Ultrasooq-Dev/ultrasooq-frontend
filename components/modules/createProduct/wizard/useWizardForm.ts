"use client";
import { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { WizardStep } from "./wizardTypes";
import {
  STEP_1_VALIDATE_FIELDS,
  STEP_2_VALIDATE_FIELDS,
  STEP_3_VALIDATE_FIELDS,
} from "./wizardSchemas";

const STEP_FIELDS: Record<WizardStep, string[]> = {
  1: STEP_1_VALIDATE_FIELDS,
  2: STEP_2_VALIDATE_FIELDS,
  3: STEP_3_VALIDATE_FIELDS,
};

interface UseWizardFormOptions {
  form: UseFormReturn<any>;
  isEditMode: boolean;
  onAiCategorize?: () => Promise<void>;
}

export function useWizardForm({
  form,
  isEditMode,
  onAiCategorize,
}: UseWizardFormOptions) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(
    () => new Set(isEditMode ? [1, 2, 3] : [])
  );

  const goToStep = useCallback(
    (step: WizardStep) => {
      setCurrentStep(step);
    },
    []
  );

  const markStepCompleted = useCallback((step: WizardStep) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  }, []);

  /**
   * Validate current step fields and move to the next step.
   * Between Step 1 → 2, fire the AI categorization callback.
   */
  const goNext = useCallback(async () => {
    if (currentStep >= 3) return;

    // Validate current step's fields
    const fields = STEP_FIELDS[currentStep];
    const valid = await form.trigger(fields as any);

    if (!valid) return;

    // Mark current step as completed
    markStepCompleted(currentStep);

    // If going from Step 1 to Step 2, trigger AI categorization
    if (currentStep === 1 && onAiCategorize) {
      try {
        await onAiCategorize();
      } catch {
        // AI failed — that's fine, user can pick manually
      }
    }

    const nextStep = (currentStep + 1) as WizardStep;
    setCurrentStep(nextStep);
  }, [currentStep, form, markStepCompleted, onAiCategorize]);

  const goBack = useCallback(() => {
    if (currentStep <= 1) return;
    const prevStep = (currentStep - 1) as WizardStep;
    setCurrentStep(prevStep);
  }, [currentStep]);

  /**
   * Allow clicking on completed or past steps to navigate directly.
   */
  const onStepClick = useCallback(
    (step: WizardStep) => {
      if (completedSteps.has(step) || step < currentStep) {
        setCurrentStep(step);
      }
    },
    [completedSteps, currentStep]
  );

  return {
    currentStep,
    completedSteps,
    goNext,
    goBack,
    goToStep,
    onStepClick,
    markStepCompleted,
  };
}
