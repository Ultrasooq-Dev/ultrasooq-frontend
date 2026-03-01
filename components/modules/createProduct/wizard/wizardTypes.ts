export type WizardStep = 1 | 2 | 3;

export interface WizardState {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  isAiLoading: boolean;
  aiSuggestions: AiCategorizationResult | null;
}

export interface AiCategorizationResult {
  suggestedTags: Array<{ id: number; tagName: string }>;
  suggestedCategories: Array<{
    id: number;
    name: string;
    path: number[];
    categoryLocation: string;
  }>;
}

// Field names belonging to each step — used for per-step validation
export const STEP_1_FIELDS = ["productName"] as const;

export const STEP_2_FIELDS = [
  "typeOfProduct",
  "brandId",
  "productShortDescriptionList",
  "productSpecificationList",
  "productVariants",
] as const;

export const STEP_3_FIELDS = [
  "setUpPrice",
  "productPrice",
  "offerPrice",
  "productPriceList",
  "variantPricingList",
] as const;

export const WIZARD_STEPS = [
  { step: 1 as WizardStep, labelKey: "wizard_step_product_info", descriptionKey: "wizard_step_product_info_desc" },
  { step: 2 as WizardStep, labelKey: "wizard_step_details_specs", descriptionKey: "wizard_step_details_specs_desc" },
  { step: 3 as WizardStep, labelKey: "wizard_step_vendor_details", descriptionKey: "wizard_step_vendor_details_desc" },
];
