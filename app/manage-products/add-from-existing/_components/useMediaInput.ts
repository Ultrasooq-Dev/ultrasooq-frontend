"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";

interface UseMediaInputProps {
  onAIGenerate: (input: string | File, type: "text" | "image" | "url") => Promise<void>;
}

export const useMediaInput = ({ onAIGenerate }: UseMediaInputProps) => {
  const t = useTranslations();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productUrl, setProductUrl] = useState("");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("invalid_file_type") || "Invalid file type",
        description: t("please_select_an_image_file") || "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRecognition = async () => {
    if (!selectedImage) {
      toast({
        title: t("please_select_image") || "Please select image",
        variant: "destructive",
      });
      return;
    }
    await onAIGenerate(selectedImage, "image");
  };

  const handleImportFromUrl = async () => {
    if (!productUrl.trim()) {
      toast({
        title: t("please_enter_url") || "Please enter URL",
        variant: "destructive",
      });
      return;
    }
    await onAIGenerate(productUrl, "url");
  };

  return {
    selectedImage,
    setSelectedImage,
    imagePreview,
    setImagePreview,
    productUrl,
    setProductUrl,
    handleImageSelect,
    handleImageRecognition,
    handleImportFromUrl,
  };
};
