"use client";
import React, { useRef } from "react";
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { isImage, isVideo } from "@/utils/helper";
import CloseWhiteIcon from "@/public/images/close-white.svg";
import AddImageContent from "../../profile/AddImageContent";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { IoMdAdd } from "react-icons/io";
import { cn } from "@/lib/utils";
import { Camera, Package, Search, Sparkles } from "lucide-react";
import AiProductSearch from "./AiProductSearch";
import type { AiProductSearchHandle } from "./AiProductSearch";

interface Step1Props {
  copy?: boolean;
  onAiProductDataReady?: (aiData: any) => void;
}

const Step1NameAndPictures: React.FC<Step1Props> = ({
  copy = false,
  onAiProductDataReady,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const form = useFormContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editingIndexRef = useRef<number>(-1);
  const aiScanFileRef = useRef<HTMLInputElement>(null);
  const aiSearchRef = useRef<AiProductSearchHandle>(null);

  const productImages: Array<{ path: string | File; id: string }> =
    form.watch("productImages") || [];

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentImages = form.getValues("productImages") || [];
    const newImages = Array.from(files).map((file) => ({
      path: file,
      id: uuidv4(),
    }));

    form.setValue("productImages", [...currentImages, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = [...(form.getValues("productImages") || [])];
    currentImages.splice(index, 1);
    form.setValue("productImages", currentImages);
  };

  const handleEditImage = (index: number) => {
    editingIndexRef.current = index;
    editFileInputRef.current?.click();
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || editingIndexRef.current < 0) return;

    const currentImages = [...(form.getValues("productImages") || [])];
    currentImages[editingIndexRef.current] = { path: file, id: uuidv4() };
    form.setValue("productImages", currentImages);
    editingIndexRef.current = -1;
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const getImageSrc = (img: { path: string | File; id: string }) => {
    if (img.path instanceof File) {
      return URL.createObjectURL(img.path);
    }
    return img.path;
  };

  // ── AI triggers ─────────────────────────────────────────────────────
  const handleAiTextSearch = () => {
    const productName = form.getValues("productName") || "";
    if (!productName.trim() || productName.trim().length < 3) {
      toast({
        title: t("search_term_too_short") || "Search term too short",
        description: t("please_enter_at_least_3_characters"),
        variant: "destructive",
      });
      return;
    }
    aiSearchRef.current?.triggerTextSearch(productName.trim());
  };

  const handleAiImageScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    aiSearchRef.current?.triggerImageScan(file);
    if (aiScanFileRef.current) aiScanFileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Product Name + AI Search Button */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <Package className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {t("product_name")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("enter_product_name_desc")}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="productName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    {...field}
                    placeholder={t("enter_product_name")}
                    className={cn(
                      "h-12 flex-1 rounded-lg border-border text-base focus:border-warning focus:ring-warning",
                      fieldState.error && "border-destructive/70",
                    )}
                    disabled={copy}
                    dir={langDir}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && onAiProductDataReady) {
                        e.preventDefault();
                        handleAiTextSearch();
                      }
                    }}
                  />
                  {onAiProductDataReady && (
                    <Button
                      type="button"
                      onClick={handleAiTextSearch}
                      className="h-12 gap-2 rounded-lg bg-info px-4 text-white hover:bg-info/90"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {t("ai_search") || "AI Search"}
                      </span>
                      <Search className="h-4 w-4 sm:hidden" />
                    </Button>
                  )}
                </div>
              </FormControl>
              {fieldState.error && (
                <p className="mt-1 text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </FormItem>
          )}
        />
      </div>

      {/* Product Images & Videos + AI Scan Button */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {t("product_images")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("add_images_and_videos_desc")}
            </p>
          </div>
          {/* AI Scan button — next to the images header */}
          {onAiProductDataReady && (
            <>
              <input
                ref={aiScanFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAiImageScan}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => aiScanFileRef.current?.click()}
                className="gap-2 border-purple-300 text-info hover:bg-info/5 hover:text-info"
              >
                <Sparkles className="h-4 w-4" />
                {t("scan_with_ai") || "Scan with AI"}
              </Button>
            </>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleAddImages}
        />
        <input
          ref={editFileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleEditImageChange}
        />

        {/* Image grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {productImages.map((img, index) => {
            const src = getImageSrc(img);
            const fileName =
              img.path instanceof File ? img.path.name : img.path;
            const isVideoFile = isVideo(fileName);

            return (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
              >
                {isVideoFile ? (
                  <video
                    src={src}
                    className="h-full w-full object-cover"
                    muted
                  />
                ) : (
                  <Image
                    src={src}
                    alt={`Product ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleEditImage(index)}
                    className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow hover:bg-muted"
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="rounded-full bg-destructive px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-destructive"
                  >
                    {t("remove")}
                  </button>
                </div>

                {/* Index badge */}
                {index === 0 && (
                  <div className="absolute left-2 top-2 rounded bg-warning px-2 py-0.5 text-xs font-bold text-white">
                    {t("main")}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add image button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted transition-colors hover:border-warning/70 hover:bg-warning/5"
          >
            <IoMdAdd className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {t("add_image")}
            </span>
          </button>
        </div>
      </div>

      {/* AI Search Results — appears below when search/scan triggered */}
      {onAiProductDataReady && (
        <AiProductSearch
          ref={aiSearchRef}
          onProductDataReady={onAiProductDataReady}
        />
      )}
    </div>
  );
};

export default Step1NameAndPictures;
