/**
 * Per-step field arrays for partial form validation.
 *
 * Usage:  form.trigger(STEP_1_VALIDATE_FIELDS)   — validates only Step 1 fields
 *
 * These are the field paths that React-Hook-Form's `trigger()` understands.
 * They are intentionally kept as plain string arrays (not as const) so RHF
 * can accept them without type gymnastics.
 */

// Step 1 – Product Name & Images
// Only the product name is strictly required before moving to Step 2.
// Images are optional (user can add them later).
export const STEP_1_VALIDATE_FIELDS: string[] = ["productName"];

// Step 2 – Product Details & Specs
// Category, brand, descriptions, specs, and variants.
// typeOfProduct is set from URL, so it should already be present.
export const STEP_2_VALIDATE_FIELDS: string[] = [
  "typeOfProduct",
  "productShortDescriptionList",
  "productSpecificationList",
  "productVariants",
];

// Step 3 – Vendor Details (pricing, location, customization)
// Pricing-related fields. Actual validation of productPriceList
// is handled by the superRefine in the main schema.
export const STEP_3_VALIDATE_FIELDS: string[] = [
  "setUpPrice",
  "productPrice",
  "offerPrice",
  "productPriceList",
  "variantPricingList",
];
