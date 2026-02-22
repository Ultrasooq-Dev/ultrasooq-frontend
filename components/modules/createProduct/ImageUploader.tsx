"use client";
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface ImageUploaderProps {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesChange,
  maxImages = 5,
  className = ""
}) => {
  const t = useTranslations();
  const [images, setImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to compress image
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newImages: string[] = [];
    const remainingSlots = maxImages - images.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          // Check file size (max 5MB before compression)
          if (file.size > 5 * 1024 * 1024) {
          }
          
          // Compress the image
          const compressedImage = await compressImage(file, 800, 0.7);
          newImages.push(compressedImage);
          
          if (newImages.length === Math.min(files.length, remainingSlots)) {
            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            onImagesChange(updatedImages);
          }
        } catch (error) {
          // Fallback to original file if compression fails
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            newImages.push(result);
            
            if (newImages.length === Math.min(files.length, remainingSlots)) {
              const updatedImages = [...images, ...newImages];
              setImages(updatedImages);
              onImagesChange(updatedImages);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-primary/70 bg-primary/5'
            : 'border-border hover:border-border'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {t("drag_and_drop_images_here")} {t("or")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={openFileDialog}
            disabled={images.length >= maxImages}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {t("browse_files")}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {t("max_images")}: {maxImages} | {t("supported_formats")}: JPG, PNG, GIF
        </p>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t("uploaded_images")} ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {images.map((image, index) => (
              <Card key={index} className="relative group">
                <CardContent className="p-0">
                  <div className="aspect-square relative overflow-hidden rounded-lg">
                    <Image
                      src={image}
                      alt={`Upload ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload More Button */}
      {images.length > 0 && images.length < maxImages && (
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={openFileDialog}
            className="text-sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t("upload_more_images")} ({maxImages - images.length} {t("remaining")})
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
