"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useCreateDropshipProduct } from "@/apis/queries/dropship.queries";
import ProductSearchSelector from "./ProductSearchSelector";
import PricingCalculator from "./PricingCalculator";
import ProductPreview from "./ProductPreview";
import ImageUploader from "./ImageUploader";

const dropshipFormSchema = (t: any) => {
  return z.object({
    originalProductId: z.number().min(1, t("please_select_a_product")),
    customProductName: z.string().min(1, t("product_name_is_required")),
    customDescription: z.string().min(1, t("description_is_required")),
    markup: z.coerce.number().min(0, t("markup_must_be_positive")),
    additionalImages: z.array(z.string()).optional(),
    marketingText: z.string().optional(),
  });
};

interface DropshipProductFormProps {}

const DropshipProductForm: React.FC<DropshipProductFormProps> = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();
  const createDropshipProduct = useCreateDropshipProduct();
  const [isClient, setIsClient] = useState(false);

  // Function to extract plain text from rich text (HTML/JSON) format
  const extractPlainText = (richText: any): string => {
    if (!richText) return '';

    let content = richText;

    // If it's a string, try to parse it as JSON first
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        // If parsing is successful and it's an object/array, use the parsed content
        if (typeof parsed === 'object' && parsed !== null) {
          content = parsed;
        } else {
          // It's a plain string, not JSON
          if (content.includes('<') && content.includes('>')) {
            // Remove HTML tags
            return content.replace(/<[^>]*>/g, '').trim();
          }
          return content;
        }
      } catch (e) {
        // Not a JSON string, treat as plain text or HTML
        if (content.includes('<') && content.includes('>')) {
          // Remove HTML tags
          return content.replace(/<[^>]*>/g, '').trim();
        }
        return content;
      }
    }

    // Now process the content (could be parsed JSON or original object/array)
    if (Array.isArray(content)) {
      return content.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          // Handle Plate.js format with text property
          if (item.text) return item.text;
          // Handle nested children
          if (item.children) {
            return extractPlainText(item.children);
          }
        }
        return '';
      }).filter(Boolean).join(' ').trim();
    }

    // If it's an object, try to extract text
    if (content && typeof content === 'object') {
      if (content.text) return content.text;
      if (content.children) return extractPlainText(content.children);
    }

    return '';
  };
  
  const [selectedOriginalProduct, setSelectedOriginalProduct] = useState<any>(null);
  const [customContent, setCustomContent] = useState({
    productName: '',
    description: '',
    additionalImages: [] as string[],
    marketingText: ''
  });
  const [markup, setMarkup] = useState(0);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm({
    resolver: zodResolver(dropshipFormSchema(t)),
    defaultValues: {
      originalProductId: 0,
      customProductName: '',
      customDescription: '',
      markup: 0,
      additionalImages: [],
      marketingText: ''
    }
  });

  const onSubmit = async (data: any) => {
    try {
      
      // Validate payload size
      const payload = {
        originalProductId: data.originalProductId,
        customProductName: data.customProductName,
        customDescription: data.customDescription,
        marketingText: data.marketingText,
        additionalImages: data.additionalImages,
        markup: data.markup,
      };
      
      // Check if payload is too large (roughly 1MB limit)
      const payloadString = JSON.stringify(payload);
      const payloadSize = new Blob([payloadString]).size;
      
      if (payloadSize > 1024 * 1024) { // 1MB
        toast({
          title: t("error"),
          description: t("payload_too_large_please_reduce_image_size"),
          variant: "destructive",
        });
        return;
      }
      
      const result = await createDropshipProduct.mutateAsync(payload);
      
      if (result.status) {
        toast({
          title: t("success"),
          description: t("dropship_product_created_successfully"),
          variant: "success",
        });
        
        // Reset form
        form.reset();
        setSelectedOriginalProduct(null);
        setCustomContent({
          productName: '',
          description: '',
          additionalImages: [],
          marketingText: ''
        });
        setMarkup(0);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      
      let errorMessage = t("failed_to_create_dropship_product");
      if (error.response?.status === 413) {
        errorMessage = t("payload_too_large_please_reduce_image_size");
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleProductSelect = (product: any) => {
    
    setSelectedOriginalProduct(product);
    const plainDescription = extractPlainText(product.description);
    
    
    setCustomContent(prev => ({
      ...prev,
      productName: product.productName,
      description: plainDescription
    }));
    
    // Set form values
    form.setValue('originalProductId', product.id);
    form.setValue('customProductName', product.productName);
    form.setValue('customDescription', plainDescription);
  };

  const handleMarkupChange = (newMarkup: number) => {
    setMarkup(newMarkup);
    form.setValue('markup', newMarkup);
  };

  const handleCustomContentChange = (field: string, value: string) => {
    setCustomContent(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Map custom content fields to form fields
    const formFieldMap: { [key: string]: string } = {
      'productName': 'customProductName',
      'description': 'customDescription',
      'marketingText': 'marketingText'
    };
    
    const formField = formFieldMap[field] || field;
    form.setValue(formField as any, value);
  };

  const handleImagesChange = (images: string[]) => {
    setCustomContent(prev => ({
      ...prev,
      additionalImages: images
    }));
    form.setValue('additionalImages', images);
  };

  if (!isClient) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Select Original Product */}
          <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("step_1_select_product_to_dropship")}
              </h3>
              {/* Submit Button - Moved Up */}
              <Button 
                type="submit" 
                className="px-8 py-3"
                disabled={!selectedOriginalProduct || createDropshipProduct.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  
                  // Manually trigger form submission
                  form.handleSubmit(
                    (data) => {
                      onSubmit(data);
                    },
                    (errors) => {
                      toast({
                        title: t("validation_error"),
                        description: t("please_fill_all_required_fields"),
                        variant: "destructive",
                      });
                    }
                  )();
                }}
              >
                {createDropshipProduct.isPending ? t("creating") : t("create_dropship_product")}
              </Button>
            </div>
            <ProductSearchSelector 
              onProductSelect={handleProductSelect}
              selectedProduct={selectedOriginalProduct}
            />
          </div>

          {/* Step 2: Customize Marketing Content */}
          {selectedOriginalProduct && (
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t("step_2_customize_your_marketing_strategy")}
              </h3>
              
              {/* Product Name Customization */}
              <div className="mb-4">
                <Label htmlFor="customProductName" className="text-sm font-medium text-gray-700">
                  {t("custom_product_name")}
                </Label>
                <Input
                  id="customProductName"
                  placeholder={t("add_your_marketing_text_to_product_name")}
                  {...form.register("customProductName")}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t("original")}: {selectedOriginalProduct.productName}
                </p>
              </div>

              {/* Description Customization */}
              <div className="mb-4">
                <Label htmlFor="customDescription" className="text-sm font-medium text-gray-700">
                  {t("custom_description")}
                </Label>
                <Textarea
                  id="customDescription"
                  placeholder={t("write_your_own_compelling_description")}
                  {...form.register("customDescription")}
                  rows={6}
                  className="mt-1"
                />
              </div>

              {/* Marketing Text Addition */}
              <div className="mb-4">
                <Label htmlFor="marketingText" className="text-sm font-medium text-gray-700">
                  {t("additional_marketing_text")}
                </Label>
                <Textarea
                  id="marketingText"
                  placeholder={t("add_special_offers_guarantees_or_marketing_messages")}
                  {...form.register("marketingText")}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Additional Images Upload */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700">
                  {t("additional_marketing_images")}
                </Label>
                <ImageUploader
                  onImagesChange={handleImagesChange}
                  maxImages={5}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 3: Pricing Strategy */}
          {selectedOriginalProduct && selectedOriginalProduct.productPrice && (
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t("step_3_set_your_pricing")}
              </h3>
              <PricingCalculator
                originalPrice={Number(selectedOriginalProduct.productPrice) || 0}
                markup={markup}
                onMarkupChange={handleMarkupChange}
              />
            </div>
          )}

          {/* Step 4: Preview */}
          {selectedOriginalProduct && (
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t("step_4_preview_your_product")}
              </h3>
              <ProductPreview
                originalProduct={selectedOriginalProduct}
                customContent={customContent}
                finalPrice={Number(selectedOriginalProduct.productPrice) + Number(markup)}
              />
            </div>
          )}

        </form>
      </Form>
    </div>
  );
};

export default DropshipProductForm;
