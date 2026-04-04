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
  { step: 1 as WizardStep, label: "Product Info", description: "Name & pictures" },
  { step: 2 as WizardStep, label: "Details & Specs", description: "Category, specs & variants" },
  { step: 3 as WizardStep, label: "Vendor Details", description: "Pricing & shipping" },
];
