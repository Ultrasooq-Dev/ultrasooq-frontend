import React from "react";
import ControlledRichTextEditor from "@/components/shared/Forms/ControlledRichTextEditor";
import ControlledMarkdownEditor from "@/components/shared/Forms/ControlledMarkdownEditor";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useFieldArray, useFormContext } from "react-hook-form";
import AddIcon from "@/public/images/add-icon.svg";
import TrashIcon from "@/public/images/social-delete-icon.svg";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import ProductVariantTypes from "./ProductVariantTypes";
import ProductLocationAndCustomizationSection from "./ProductLocationAndCustomizationSection";
import PriceSection from "./PriceSection";
import { usePathname } from "next/navigation";

type DescriptionAndSpecificationSectionProps = {
  activeProductType?: string;
  /** When true, hides PriceSection and LocationSection (they live in Step 3 of the wizard) */
  wizardMode?: boolean;
};

const DescriptionAndSpecificationSection: React.FC<
  DescriptionAndSpecificationSectionProps
> = ({ activeProductType, wizardMode = false }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const pathname = usePathname();
  const formContext = useFormContext();

  const fieldArrayForSpecification = useFieldArray({
    control: formContext.control,
    name: "productSpecificationList",
  });

  const appendSpecification = () =>
    fieldArrayForSpecification.append({
      label: "",
      specification: "",
    });

  const removeSpecification = (index: number) => fieldArrayForSpecification.remove(index);

  return (
    <div className="space-y-8">
      {/* Description Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-8 h-8 bg-info rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-semibold">1</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-foreground">
              {t("description")}
            </h4>
          </div>
        </div>
        
        <div className="bg-muted rounded-xl p-4 border border-border">
          <ControlledMarkdownEditor
            label={t("description")}
            name="descriptionJson"
            height={400}
          />
        </div>
      </div>

      {/* Specifications Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">2</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                {t("specification")}
              </h4>
            </div>
          </div>
          
          <Button
            type="button"
            onClick={appendSpecification}
                className="flex items-center gap-2 bg-warning hover:bg-warning text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            dir={langDir}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span translate="no">{t("add_specification")}</span>
          </Button>
        </div>

        <div className="space-y-4">
          {fieldArrayForSpecification.fields.map((field, index) => (
            <div
              key={field.id}
              className="relative bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {t("label")}
                  </Label>
                  <ControlledTextInput
                    name={`productSpecificationList.${index}.label`}
                    placeholder={t("enter_label")}
                    dir={langDir}
                    translate="no"
                    showLabel={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t("value")}
                  </Label>
                  <ControlledTextInput
                    name={`productSpecificationList.${index}.specification`}
                    placeholder={t("enter_value")}
                    dir={langDir}
                    translate="no"
                    showLabel={false}
                  />
                </div>
              </div>

              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => removeSpecification(index)}
                  className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors duration-200"
                  title={t("remove_specification")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Product Variants Section */}
      {pathname == "/product" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-8 h-8 bg-info rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">3</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                {t("product_variants")}
              </h4>
            </div>
          </div>
          
          <div className="bg-muted rounded-xl p-4 border border-border">
            <ProductVariantTypes />
          </div>
        </div>
      )}

      {/* Product Location and Customization Section — hidden in wizard mode (lives in Step 3) */}
      {pathname == "/product" && !wizardMode && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">4</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                {t("product_location_and_customization")}
              </h4>
            </div>
          </div>

          <div className="bg-muted rounded-xl p-4 border border-border">
            <ProductLocationAndCustomizationSection
              activeProductType={activeProductType}
            />
          </div>
        </div>
      )}

      {/* Price Section — hidden in wizard mode (lives in Step 3) */}
      {pathname == "/product" && !wizardMode && (
        <PriceSection activeProductType={activeProductType} />
      )}
    </div>
  );
};

export default DescriptionAndSpecificationSection;
