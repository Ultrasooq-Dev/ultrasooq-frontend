"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductConditionsFilterProps {
  displayStoreProducts: boolean;
  displayBuyGroupProducts: boolean;
  displayTrialProducts: boolean;
  displayWholesaleProducts: boolean;
  displayExpiredProducts: boolean;
  displayHiddenProducts: boolean;
  displayDiscountedProducts: boolean;
  setDisplayStoreProducts: (v: boolean) => void;
  setDisplayBuyGroupProducts: (v: boolean) => void;
  setDisplayTrialProducts: (v: boolean) => void;
  setDisplayWholesaleProducts: (v: boolean) => void;
  setDisplayExpiredProducts: (v: boolean) => void;
  setDisplayHiddenProducts: (v: boolean) => void;
  setDisplayDiscountedProducts: (v: boolean) => void;
}

const ProductConditionsFilter: React.FC<ProductConditionsFilterProps> = ({
  displayStoreProducts,
  displayBuyGroupProducts,
  displayTrialProducts,
  displayWholesaleProducts,
  displayExpiredProducts,
  displayHiddenProducts,
  displayDiscountedProducts,
  setDisplayStoreProducts,
  setDisplayBuyGroupProducts,
  setDisplayTrialProducts,
  setDisplayWholesaleProducts,
  setDisplayExpiredProducts,
  setDisplayHiddenProducts,
  setDisplayDiscountedProducts,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <Accordion type="multiple" defaultValue={["product_conditions"]}>
      <AccordionItem value="product_conditions">
        <AccordionTrigger className="text-base hover:no-underline!">
          {t("by_menu")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="displayStoreProducts"
                className="border border-border data-[state=checked]:bg-primary!"
                onCheckedChange={(checked: boolean) => setDisplayStoreProducts(checked)}
                checked={displayStoreProducts}
              />
              <label htmlFor="displayStoreProducts" className="text-sm font-medium cursor-pointer" dir={langDir} translate="no">
                {t("store")}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="displayBuyGroupProducts"
                className="border border-border data-[state=checked]:bg-primary!"
                onCheckedChange={(checked: boolean) => {
                  setDisplayBuyGroupProducts(checked);
                  setDisplayExpiredProducts(checked ? displayExpiredProducts : false);
                }}
                checked={displayBuyGroupProducts}
              />
              <label htmlFor="displayBuyGroupProducts" className="text-sm font-medium cursor-pointer" dir={langDir} translate="no">
                {t("buy_group")}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="displayTrialProducts"
                className="border border-border data-[state=checked]:bg-primary!"
                onCheckedChange={(checked: boolean) => setDisplayTrialProducts(checked)}
                checked={displayTrialProducts}
              />
              <label htmlFor="displayTrialProducts" className="text-sm font-medium cursor-pointer" dir={langDir} translate="no">
                {t("trial_product")}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="displayWholesaleProducts"
                className="border border-border data-[state=checked]:bg-primary!"
                onCheckedChange={(checked: boolean) => setDisplayWholesaleProducts(checked)}
                checked={displayWholesaleProducts}
              />
              <label htmlFor="displayWholesaleProducts" className="text-sm font-medium cursor-pointer" dir={langDir} translate="no">
                {t("wholesale_product")}
              </label>
            </div>
            {displayBuyGroupProducts ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="displayExpiredProducts"
                  className="border border-border data-[state=checked]:bg-primary!"
                  onCheckedChange={(checked: boolean) => setDisplayExpiredProducts(checked)}
                  checked={displayExpiredProducts}
                />
                <label htmlFor="displayExpiredProducts" className="text-sm font-medium cursor-pointer" dir={langDir} translate="no">
                  {t("expired")}
                </label>
              </div>
            ) : null}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="displayHiddenProducts"
                className="border border-border data-[state=checked]:bg-primary!"
                onCheckedChange={(checked: boolean) => setDisplayHiddenProducts(checked)}
                checked={displayHiddenProducts}
              />
              <label htmlFor="displayHiddenProducts" className="text-sm font-medium cursor-pointer" dir={langDir} translate="no">
                {t("hidden")}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="displayDiscountedProducts"
                className="border border-border data-[state=checked]:bg-primary!"
                onCheckedChange={(checked: boolean) => setDisplayDiscountedProducts(checked)}
                checked={displayDiscountedProducts}
              />
              <label htmlFor="displayDiscountedProducts" className="text-sm font-medium cursor-pointer" dir={langDir} translate="no">
                {t("discounted")}
              </label>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ProductConditionsFilter;
