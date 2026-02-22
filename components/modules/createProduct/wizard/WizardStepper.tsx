"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { WizardStep } from "./wizardTypes";
import { WIZARD_STEPS } from "./wizardTypes";

interface WizardStepperProps {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  onStepClick?: (step: WizardStep) => void;
}

const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {WIZARD_STEPS.map(({ step, label, description }, index) => {
          const isActive = currentStep === step;
          const isCompleted = completedSteps.has(step);
          const isClickable = isCompleted || step < currentStep;

          return (
            <React.Fragment key={step}>
              {/* Connector line */}
              {index > 0 && (
                <div className="flex-1 h-0.5 mx-2">
                  <div
                    className={cn(
                      "h-full transition-colors duration-300",
                      isCompleted || step <= currentStep
                        ? "bg-warning"
                        : "bg-gray-200"
                    )}
                  />
                </div>
              )}

              {/* Step circle + label */}
              <div
                className={cn(
                  "flex flex-col items-center relative z-10",
                  isClickable ? "cursor-pointer" : "cursor-default"
                )}
                onClick={() => isClickable && onStepClick?.(step)}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2",
                    isActive
                      ? "bg-warning border-warning text-white shadow-lg shadow-orange-200"
                      : isCompleted
                      ? "bg-success border-success text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center whitespace-nowrap",
                    isActive
                      ? "text-warning"
                      : isCompleted
                      ? "text-success"
                      : "text-gray-400"
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "text-[10px] text-center whitespace-nowrap",
                    isActive ? "text-gray-600" : "text-gray-400"
                  )}
                >
                  {description}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WizardStepper;
