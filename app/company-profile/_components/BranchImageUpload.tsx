"use client";
import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { UseFormReturn } from "react-hook-form";

interface BranchImageUploadProps {
  form: UseFormReturn<any>;
  fieldName: string;
  label: string;
  dropLabel: string;
  specLabel: string;
  langDir: string;
  handleUploadedFile: (files: FileList | null) => Promise<string | undefined>;
}

export default function BranchImageUpload({
  form,
  fieldName,
  label,
  dropLabel,
  specLabel,
  langDir,
  handleUploadedFile,
}: BranchImageUploadProps) {
  const { toast } = useToast();
  const t = useTranslations();
  const currentValue = form.getValues(fieldName as any);

  return (
    <FormField
      control={form.control}
      name={fieldName as any}
      render={({ field }) => (
        <FormItem className="mb-3.5 w-full">
          <FormLabel dir={langDir} translate="no">{label}</FormLabel>
          <FormControl>
            <div className="relative m-auto h-64 w-full border-2 border-dashed border-border">
              <div className="relative h-full w-full">
                {currentValue ? (
                  <Image src={currentValue || "/images/no-image.jpg"} alt="upload" fill priority className="object-contain" />
                ) : (
                  <div className="absolute my-auto h-full w-full text-center text-sm font-medium leading-4 text-color-dark">
                    <div className="flex h-full flex-col items-center justify-center" dir={langDir}>
                      <Image src="/images/upload.png" className="mb-3" width={30} height={30} alt="camera" />
                      <span translate="no">{dropLabel} </span>
                      <span className="text-primary">browse</span>
                      <p className="text-normal mt-3 text-xs leading-4 text-muted-foreground" translate="no">({specLabel})</p>
                    </div>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  multiple={false}
                  className="bottom-0! h-64 w-full! opacity-0"
                  value=""
                  onChange={async (event) => {
                    if (event.target.files?.[0]) {
                      if (event.target.files[0].size > 524288000) {
                        toast({ title: t("image_size_should_be_less_than_size", { size: "500MB" }), variant: "danger" });
                        return;
                      }
                      const response = await handleUploadedFile(event.target.files);
                      field.onChange(response);
                    }
                  }}
                  id={fieldName}
                />
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
