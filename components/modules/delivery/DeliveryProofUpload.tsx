"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Camera, Upload, X, CheckCircle } from "lucide-react";
import Image from "next/image";

type DeliveryProofUploadProps = {
  orderProductId: number;
  existingProofUrl?: string | null;
  onUpload: (file: File) => Promise<string | null>;
  onSubmitProof: (proofUrl: string) => Promise<void>;
  isLoading?: boolean;
};

const DeliveryProofUpload: React.FC<DeliveryProofUploadProps> = ({
  orderProductId,
  existingProofUrl,
  onUpload,
  onSubmitProof,
  isLoading = false,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingProofUrl || null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const url = await onUpload(file);
      if (url) {
        await onSubmitProof(url);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card dir={langDir}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {t("proof_of_delivery")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="Delivery proof"
              width={300}
              height={200}
              className="rounded-md object-cover w-full max-h-48"
            />
            {existingProofUrl && (
              <div className="absolute top-2 end-2 bg-green-500 text-white rounded-full p-1">
                <CheckCircle className="h-4 w-4" />
              </div>
            )}
            {!existingProofUrl && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="h-4 w-4 me-1" />
                {t("remove")}
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-24 border-dashed flex flex-col gap-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isLoading}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">
              {uploading ? t("uploading") : t("upload_proof")}
            </span>
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
};

export default DeliveryProofUpload;
