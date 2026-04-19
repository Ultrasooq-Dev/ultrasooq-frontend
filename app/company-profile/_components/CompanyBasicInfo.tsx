"use client";
import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FolderTree } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import CategoryTreeModal from "@/components/shared/CategoryTreeModal";
import { useToast } from "@/components/ui/use-toast";
import { CompanyBasicInfoProps } from "./types";

export default function CompanyBasicInfo({
  form,
  langDir,
  imageFile,
  crFile,
  setImageFile,
  setCrFile,
  businessTypeModalOpen,
  businessTypeModalField,
  setBusinessTypeModalOpen,
  setBusinessTypeModalField,
}: CompanyBasicInfoProps) {
  const t = useTranslations();
  const { toast } = useToast();

  return (
    <div className="mb-3.5 w-full">
      <div className="mt-2.5 w-full border-b-2 border-dashed border-border mb-4">
        <label
          className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark"
          dir={langDir}
          translate="no"
        >
          {t("company_information")}
        </label>
      </div>

      <div className="flex flex-wrap">
        {/* Logo Upload */}
        <FormField
          control={form.control}
          name="uploadImage"
          render={({ field }) => (
            <FormItem className="mb-3.5 w-full md:w-6/12 md:pr-3.5">
              <FormLabel dir={langDir} translate="no">
                {t("upload_company_logo")}
              </FormLabel>
              <FormControl>
                <div className="relative m-auto h-64 w-full border-2 border-dashed border-border">
                  <div className="relative h-full w-full">
                    {imageFile ? (
                      <Image
                        src={imageFile ? URL.createObjectURL(imageFile[0]) : "/images/no-image.jpg"}
                        alt="profile"
                        fill
                        priority
                        className="object-contain"
                      />
                    ) : (
                      <div className="absolute my-auto h-full w-full text-center text-sm font-medium leading-4 text-color-dark">
                        <div className="flex h-full flex-col items-center justify-center">
                          <Image src="/images/upload.png" className="mb-3" width={30} height={30} alt="camera" />
                          <span dir={langDir} translate="no">{t("drop_your_company_logo")} </span>
                          <span className="text-primary">browse</span>
                          <p className="text-normal mt-3 text-xs leading-4 text-muted-foreground" dir={langDir} translate="no">
                            ({t("company_logo_spec")})
                          </p>
                        </div>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      multiple={false}
                      className="bottom-0! h-64 w-full! opacity-0"
                      {...field}
                      onChange={(event) => {
                        if (event.target.files?.[0]) {
                          if (event.target.files[0].size > 524288000) {
                            toast({ title: t("image_size_should_be_less_than_size", { size: "500MB" }), variant: "danger" });
                            return;
                          }
                          setImageFile(event.target.files);
                        }
                      }}
                      id="uploadImage"
                    />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CR Document Upload */}
        <FormField
          control={form.control}
          name={"uploadCR" as any}
          render={({ field }) => (
            <FormItem className="mb-3.5 w-full md:w-6/12 md:pl-3.5">
              <FormLabel dir={langDir} translate="no">
                {t("commercial_registration") || "Commercial Registration (CR)"}
              </FormLabel>
              <FormControl>
                <div className="relative m-auto h-64 w-full border-2 border-dashed border-border rounded-lg">
                  <div className="relative h-full w-full">
                    {crFile ? (
                      <div className="flex h-full flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-red-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <span className="text-sm font-semibold text-foreground">{crFile[0]?.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">{(crFile[0]?.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button type="button" onClick={() => setCrFile(null)} className="mt-2 text-xs text-destructive hover:underline">
                          {t("remove") || "Remove"}
                        </button>
                      </div>
                    ) : (
                      <div className="absolute my-auto h-full w-full text-center text-sm font-medium leading-4 text-color-dark">
                        <div className="flex h-full flex-col items-center justify-center">
                          <svg className="h-10 w-10 text-muted-foreground mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <polyline points="9 15 12 12 15 15" />
                          </svg>
                          <span dir={langDir} translate="no">{t("upload_cr_document") || "Upload CR Document"}</span>
                          <span className="text-primary">browse</span>
                          <p className="text-normal mt-2 text-xs leading-4 text-muted-foreground" dir={langDir} translate="no">(PDF, max 10MB)</p>
                        </div>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple={false}
                      className="bottom-0! h-64 w-full! opacity-0"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        if (event.target.files?.[0]) {
                          if (event.target.files[0].size > 10485760) {
                            toast({ title: t("file_size_should_be_less_than_size", { size: "10MB" }) || "File must be less than 10MB", variant: "danger" });
                            return;
                          }
                          if (!event.target.files[0].name.toLowerCase().endsWith(".pdf")) {
                            toast({ title: t("only_pdf_files_allowed") || "Only PDF files are allowed", variant: "danger" });
                            return;
                          }
                          setCrFile(event.target.files);
                          field.onChange(event.target.files);
                        }
                      }}
                      id="uploadCR"
                    />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Name, Business Type, Annual Purchasing Volume */}
        <div className="mb-3.5 w-full md:w-6/12 md:pl-3.5">
          <ControlledTextInput
            label={t("company_name")}
            name="companyName"
            placeholder={t("company_name")}
            dir={langDir}
            translate="no"
          />

          <div>
            <Label className="mb-2 block text-sm font-medium" dir={langDir} translate="no">{t("business_type")}</Label>
            <button
              type="button"
              onClick={() => { setBusinessTypeModalField("businessTypeList"); setBusinessTypeModalOpen(true); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border text-sm text-start hover:border-primary/50 transition-colors"
            >
              {((form.watch("businessTypeList") as unknown as any[]) || []).length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {((form.watch("businessTypeList") as unknown as any[]) || []).map((item: any) => (
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
              open={businessTypeModalOpen && businessTypeModalField === "businessTypeList"}
              onClose={() => setBusinessTypeModalOpen(false)}
              onSelect={(selected) => {
                form.setValue("businessTypeList" as any, selected.map((s) => ({
                  categoryId: s.categoryId,
                  categoryLocation: s.categoryLocation,
                  name: s.name,
                })));
              }}
              initialSelected={(form.watch("businessTypeList") || []).map((item: any) => ({
                categoryId: item.categoryId,
                categoryLocation: item.categoryLocation || "",
                name: item.name || "",
              }))}
            />
          </div>

          <ControlledTextInput
            label={t("annual_purchasing_volume")}
            name="annualPurchasingVolume"
            placeholder={t("annual_purchasing_volume")}
            type="number"
            onWheel={(e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()}
            dir={langDir}
            translate="no"
          />
        </div>
      </div>
    </div>
  );
}
