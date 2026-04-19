"use client";
import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import CategoryTreeModal from "@/components/shared/CategoryTreeModal";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";
import { CompanyBranchItemProps } from "./types";
import BranchWorkingHours from "./BranchWorkingHours";
import BranchImageUpload from "./BranchImageUpload";

export default function CompanyBranchItem({
  form,
  index,
  langDir,
  memoizedCountries,
  businessTypeModalOpen,
  businessTypeModalField,
  setBusinessTypeModalOpen,
  setBusinessTypeModalField,
  categoryModalOpen,
  categoryModalField,
  setCategoryModalOpen,
  setCategoryModalField,
  handleUploadedFile,
  removeBranchList,
}: CompanyBranchItemProps) {
  const t = useTranslations();

  return (
    <div>
      <div className="mb-3.5 w-full">
        {/* Business Type */}
        <div>
          <Label className="mb-2 block text-sm font-medium" dir={langDir} translate="no">{t("business_type")}</Label>
          <button
            type="button"
            onClick={() => { setBusinessTypeModalField(`branchList.${index}.businessTypeList`); setBusinessTypeModalOpen(true); }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border text-sm text-start hover:border-primary/50 transition-colors"
          >
            {((form.watch(`branchList.${index}.businessTypeList`) as unknown as any[]) || []).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {((form.watch(`branchList.${index}.businessTypeList`) as unknown as any[]) || []).map((item: any) => (
                  <span key={item.categoryId} className="px-2 py-0.5 rounded bg-primary/10 text-xs font-medium text-primary">
                    {item.name || `ID: ${item.categoryId}`}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">{t("select_business_type") || "Select Business Type"}</span>
            )}
            <FolderTree className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
          <CategoryTreeModal
            open={businessTypeModalOpen && businessTypeModalField === `branchList.${index}.businessTypeList`}
            onClose={() => setBusinessTypeModalOpen(false)}
            onSelect={(selected) => {
              form.setValue(`branchList.${index}.businessTypeList` as any, selected.map((s) => ({
                categoryId: s.categoryId,
                categoryLocation: s.categoryLocation,
                name: s.name,
              })));
            }}
            initialSelected={(form.watch(`branchList.${index}.businessTypeList`) || []).map((item: any) => ({
              categoryId: item.categoryId,
              categoryLocation: item.categoryLocation || "",
              name: item.name || "",
            }))}
          />
          {(form.formState.errors?.branchList as any)?.[index]?.businessTypeList?.message && (
            <p className="mt-1 text-xs text-destructive">{String((form.formState.errors.branchList as any)[index]?.businessTypeList?.message)}</p>
          )}
        </div>

        {/* Branch Front Picture */}
        <BranchImageUpload
          form={form}
          fieldName={`branchList.${index}.branchFrontPicture`}
          label={t("upload_branch_front_picture")}
          dropLabel={t("drop_your_branch_front_picture")}
          specLabel={t("branch_front_picture_spec")}
          langDir={langDir}
          handleUploadedFile={handleUploadedFile}
        />

        {/* Proof of Address */}
        <BranchImageUpload
          form={form}
          fieldName={`branchList.${index}.proofOfAddress`}
          label={t("proof_of_address")}
          dropLabel={t("drop_your_address_proof")}
          specLabel={t("address_proof_spec")}
          langDir={langDir}
          handleUploadedFile={handleUploadedFile}
        />
      </div>

      {/* Branch Location */}
      <div className="flex w-full flex-wrap">
        <div className="mb-4 w-full">
          <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
            <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark" dir={langDir} translate="no">
              {t("branch_location")}
            </label>
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
          <div className="relative w-full">
            <ControlledTextInput label={t("address")} name={`branchList.${index}.address`} placeholder={t("address")} showLabel={true} dir={langDir} translate="no" />
            <Image src="/images/location.svg" alt="location-icon" height={16} width={16} className="absolute right-6 top-[50px]" />
          </div>
          <ControlledTextInput label={t("city")} name={`branchList.${index}.city`} placeholder={t("city")} showLabel={true} dir={langDir} translate="no" />
        </div>
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
          <ControlledTextInput label={t("province")} name={`branchList.${index}.province`} placeholder={t("province")} showLabel={true} dir={langDir} translate="no" />
          <ControlledSelectInput label={t("country")} name={`branchList.${index}.country`} options={memoizedCountries} />
        </div>
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
          <ControlledPhoneInput label={t("branch_contact_number")} name={`branchList.${index}.contactNumber`} countryName="cc" placeholder={t("branch_contact_number")} />
          <ControlledTextInput className="mt-0" label={t("branch_contact_name")} name={`branchList.${index}.contactName`} placeholder={t("branch_contact_name")} showLabel={true} dir={langDir} translate="no" />
        </div>
      </div>

      {/* Working Hours */}
      <BranchWorkingHours form={form} index={index} langDir={langDir} />

      {/* Category List */}
      <div className="mb-3.5">
        <Label className="mb-2 block text-sm font-medium" dir={langDir} translate="no">{t("categories") || "Product / Service Categories"}</Label>
        <button
          type="button"
          onClick={() => { setCategoryModalField(`branchList.${index}.categoryList`); setCategoryModalOpen(true); }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border text-sm text-start hover:border-primary/50 transition-colors"
        >
          {((form.watch(`branchList.${index}.categoryList`) as unknown as any[]) || []).length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {((form.watch(`branchList.${index}.categoryList`) as unknown as any[]) || []).map((item: any, ci: number) => (
                <span key={ci} className="px-2 py-0.5 rounded bg-blue-50 text-xs font-medium text-blue-700">
                  {item.name || `ID: ${item.categoryId}`}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{t("select_categories") || "Select Product / Service Categories"}</span>
          )}
          <FolderTree className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
        <CategoryTreeModal
          open={categoryModalOpen && categoryModalField === `branchList.${index}.categoryList`}
          onClose={() => setCategoryModalOpen(false)}
          rootCategoryId={PRODUCT_CATEGORY_ID}
          title={t("categories") || "Product / Service Categories"}
          onSelect={(selected) => {
            form.setValue(`branchList.${index}.categoryList` as any, selected.map((s) => ({
              categoryId: s.categoryId,
              categoryLocation: s.categoryLocation,
              name: s.name,
            })));
          }}
          initialSelected={(form.watch(`branchList.${index}.categoryList`) || []).map((item: any) => ({
            categoryId: item.categoryId,
            categoryLocation: item.categoryLocation || "",
            name: item.name || "",
          }))}
        />
      </div>

      {/* Main Office toggle + Remove */}
      <div className="mb-3.5 flex w-full justify-end border-b-2 border-dashed border-border pb-4">
        <div className="mb-3.5 flex w-full border-b-2 border-dashed border-border pb-4">
          <FormField
            control={form.control}
            name={`branchList.${index}.mainOffice`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-x-2 rounded-lg">
                <FormLabel dir={langDir} translate="no">{t("main_office")}:</FormLabel>
                <FormControl>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0! data-[state=checked]:bg-dark-orange!"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        {index !== 0 ? (
          <Button
            type="button"
            onClick={() => removeBranchList(index)}
            className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
          >
            <Image src="/images/social-delete-icon.svg" height={35} width={35} alt="social-delete-icon" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
