"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useExistingProduct } from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { useToast } from "@/components/ui/use-toast";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Copy, ArrowLeft, Eye, X, Camera, Link as LinkIcon, Sparkles, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { getApiUrl } from "@/config/api";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";

const AddFromExistingProductPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const me = useMe();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(false);

  // AI Generation States
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
  const [aiProductSuggestions, setAiProductSuggestions] = useState<any[]>([]);
  const [aiProductModels, setAiProductModels] = useState<Array<{modelName: string; specifications: string}>>([]);
  const [aiModelSource, setAiModelSource] = useState<"text" | "image" | "url" | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelExists, setModelExists] = useState<boolean | null>(null);
  const [checkingModel, setCheckingModel] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [processingProductIndex, setProcessingProductIndex] = useState<number | null>(null);
  const [autoAISearchTriggered, setAutoAISearchTriggered] = useState(false);
  const [aiSearchSkipped, setAiSearchSkipped] = useState(false);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  // Image Recognition States
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // URL Import States
  const [productUrl, setProductUrl] = useState("");

  // Store the search term that was used for the query (only updated on button click)
  const [querySearchTerm, setQuerySearchTerm] = useState("");

  const { data: searchData, refetch: searchProducts, isError, error } = useExistingProduct(
    {
      page: 1,
      limit: 10,
      term: querySearchTerm, // Use querySearchTerm instead of searchTerm
      brandAddedBy: me.data?.data?.id,
    },
    shouldSearch && querySearchTerm.trim().length >= 3
  );

  // Fetch categories for matching
  const categoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());

  // Build brief specifications string for AI product suggestions (image/URL flow)
  const buildSpecsFromProductSuggestion = (product: any): string => {
    const lines: string[] = [];

    if (product.brand) {
      lines.push(`Brand: ${product.brand}`);
    }
    if (product.category) {
      lines.push(`Category: ${product.category}`);
    }
    const price = product.estimatedPrice ?? product.price;
    if (price) {
      lines.push(`Price: ${price}`);
    }
    if (Array.isArray(product.specifications) && product.specifications.length > 0) {
      for (const spec of product.specifications.slice(0, 3)) {
        if (spec.label && spec.specification) {
          lines.push(`${spec.label}: ${spec.specification}`);
        }
      }
    }

    return lines.join("\n");
  };

  // Helper function to find category path in hierarchy
  const findCategoryPathInHierarchy = (
    categories: any[], 
    targetId: number | string, 
    currentPath: number[] = []
  ): number[] | null => {
    for (const category of categories) {
      const newPath = [...currentPath, category.id];
      
      // If this category matches, return the path
      if (category.id?.toString() === targetId?.toString() || 
          Number(category.id) === Number(targetId)) {
        return newPath;
      }
      
      // Search in children
      if (category.children && category.children.length > 0) {
        const found = findCategoryPathInHierarchy(category.children, targetId, newPath);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // Helper function to flatten category tree and mark leaf categories
  const flattenCategories = (categories: any[], parentPath: number[] = []): Array<{id: number; name: string; isLeaf: boolean; path: number[]; category: any}> => {
    const result: Array<{id: number; name: string; isLeaf: boolean; path: number[]; category: any}> = [];
    
    for (const category of categories) {
      const currentPath = [...parentPath, category.id];
      const hasChildren = category.children && category.children.length > 0;
      
      // Add current category
      result.push({
        id: category.id,
        name: category.name,
        isLeaf: !hasChildren,
        path: currentPath,
        category: category,
      });
      
      // Recursively add children
      if (hasChildren) {
        result.push(...flattenCategories(category.children, currentPath));
      }
    }
    
    return result;
  };

  // Helper function to find a category by ID in the tree
  const findCategoryById = (categories: any[], targetId: number | string): any => {
    for (const category of categories) {
      if (category.id?.toString() === targetId?.toString() || Number(category.id) === Number(targetId)) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(category.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // AI-based category matching function
  const findMatchingCategoryWithAI = async (
    aiCategoryName: string,
    productName?: string
  ): Promise<{ matchedCategoryId: number | null; confidence: string }> => {
    if (!categoriesQuery?.data?.data?.children || !aiCategoryName) {
      return { matchedCategoryId: null, confidence: "low" };
    }

    // Flatten all categories including leaf categories
    const allCategories = flattenCategories(
      categoriesQuery.data.data.children
    );

    // Separate leaf and parent categories
    const leafCategories = allCategories.filter((cat) => cat.isLeaf);
    const parentCategories = allCategories.filter((cat) => !cat.isLeaf);

    try {
      const token = getCookie(PUREMOON_TOKEN_KEY);

      // STEP 1: Try matching with ONLY leaf categories first
      if (leafCategories.length > 0) {
        const leafCategoriesForMatching = leafCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          isLeaf: true,
        }));

        const leafResponse = await fetch(
          `${getApiUrl()}/product/ai-match-category`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              aiCategoryName,
              productName: productName || undefined,
              availableCategories: leafCategoriesForMatching,
            }),
          }
        );

        const leafData = await leafResponse.json();

        if (leafData.status && leafData.data && leafData.data.matchedCategoryId) {
          // Found a leaf category match - use it!
          return {
            matchedCategoryId: leafData.data.matchedCategoryId,
            confidence: leafData.data.confidence || "medium",
          };
        }
      }

      // STEP 2: If no leaf category matched, try with parents only (fallback)
      const parentCategoriesForMatching = parentCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        isLeaf: false,
      }));

      if (parentCategoriesForMatching.length === 0) {
        return { matchedCategoryId: null, confidence: "low" };
      }

      const response = await fetch(
        `${getApiUrl()}/product/ai-match-category`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            aiCategoryName,
            availableCategories: parentCategoriesForMatching,
          }),
        }
      );

      const data = await response.json();

      if (data.status && data.data && data.data.matchedCategoryId) {
        return {
          matchedCategoryId: data.data.matchedCategoryId,
          confidence: data.data.confidence || "low",
        };
      }

      return { matchedCategoryId: null, confidence: "low" };
    } catch (error) {
      console.error("AI category matching error:", error);
      return { matchedCategoryId: null, confidence: "low" };
    }
  };

  const handleAddNewProduct = () => {
    router.push("/product");
  };

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      toast({
        title: t("please_enter_product_name"),
        description: t("search_term_too_short"),
        variant: "destructive",
      });
      return;
    }

    if (searchTerm.trim().length < 3) {
      toast({
        title: t("search_term_too_short"),
        description: t("search_term_too_short"),
        variant: "destructive",
      });
      return;
    }

    // Clear previous AI suggestions and reset auto-trigger flag
    setAiProductSuggestions([]);
    setAiProductModels([]);
    setAutoAISearchTriggered(false);
    setAiSearchSkipped(false); // Reset skip flag when user searches again
    // Set the query search term (this will trigger the query)
    setQuerySearchTerm(searchTerm.trim());
    // Enable search and trigger the query
    setShouldSearch(true);
    setIsSearching(true);
  }, [searchTerm, toast, t]);

  const handleSelectProduct = (product: any) => {
    router.push(`/product?copy=${product.id}&fromExisting=true`);
  };

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductPopup(true);
  };

  const closeProductPopup = () => {
    setShowProductPopup(false);
    setSelectedProduct(null);
  };

  // Unified AI Generation Function (works for text, image, or URL)
  const handleAIGenerate = useCallback(async (input: string | File, type: 'text' | 'image' | 'url') => {
    // Cancel any existing AI generation
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    aiAbortControllerRef.current = abortController;
    setIsAIGenerating(true);
    
    try {
      const token = getCookie(PUREMOON_TOKEN_KEY);
      
      // For text queries, use the new lightweight list endpoint to get models only
      if (type === 'text' && typeof input === 'string') {
        const response = await fetch(`${getApiUrl()}/product/ai-generate-list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'text',
            query: input,
          }),
          signal: abortController.signal,
        });
        
        // Check if request was aborted before processing response
        if (abortController.signal.aborted) {
          return;
        }
        
        const data = await response.json();
        
        // Check again after parsing JSON (in case abort happened during parsing)
        if (abortController.signal.aborted) {
          return;
        }
        
        // Check again before processing data
        if (abortController.signal.aborted) {
          return;
        }
        
        if (data.status && data.data && Array.isArray(data.data) && data.data.length > 0) {
          // Check again before state updates
          if (abortController.signal.aborted) {
            return;
          }
          // Now data.data is an array of model names (strings)
          setAiProductModels(data.data);
          setAiModelSource("text");
          setAiProductSuggestions([]); // Clear old suggestions
          toast({
            title: t("search_successful") || "Search Successful",
            description: t("found_models", { n: data.data.length }) || `Found ${data.data.length} product models`,
          });
        } else {
          // Check again before showing toast
          if (abortController.signal.aborted) {
            return;
          }
          toast({
            title: t("no_results_found") || "No Results",
            description: data.message || t("no_models_found") || "No product models found",
            variant: "destructive",
          });
        }
      } else {
        // For image/URL, generate suggestions and normalize to model list
        const formData = new FormData();
        
        if (type === 'image' && input instanceof File) {
          formData.append('image', input);
          formData.append('type', 'image');
        } else if (type === 'url' && typeof input === 'string') {
          formData.append('url', input);
          formData.append('type', 'url');
        }

        const response = await fetch(`${getApiUrl()}/product/ai-generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
          signal: abortController.signal,
        });
        
        // Check if request was aborted before processing response
        if (abortController.signal.aborted) {
          return;
        }
        
        const data = await response.json();
        
        // Check again after parsing JSON (in case abort happened during parsing)
        if (abortController.signal.aborted) {
          return;
        }
        
        // Check again before processing data
        if (abortController.signal.aborted) {
          return;
        }
        
        if (data.status && data.data) {
          // Check if data is an array (multiple suggestions) or single object
          const isArray = Array.isArray(data.data);
          
          if (isArray && data.data.length > 0) {
            if (abortController.signal.aborted) {
              return;
            }

            const models = data.data
              .map((p: any) => ({
                modelName: p.productName || p.name || "",
                specifications: buildSpecsFromProductSuggestion(p),
              }))
              .filter((m: any) => m.modelName && m.modelName.trim().length > 0);

            setAiProductModels(models);
            setAiProductSuggestions([]);
            setAiGeneratedData(data.data);
            setAiModelSource("image");

            toast({
              title: t("search_successful") || "Search Successful",
              description:
                t("found_models", { n: models.length }) ||
                `Found ${models.length} product models`,
            });
          } else if (!isArray && data.data) {
            if (abortController.signal.aborted) {
              return;
            }

            const product = data.data;
            const models = [
              {
                modelName: product.productName || product.name || "",
                specifications: buildSpecsFromProductSuggestion(product),
              },
            ].filter((m: any) => m.modelName && m.modelName.trim().length > 0);

            setAiProductModels(models);
            setAiProductSuggestions([]);
            setAiGeneratedData([product]);
            setAiModelSource("image");

            toast({
              title: t("search_successful") || "Search Successful",
              description:
                t("found_models", { n: models.length }) ||
                `Found ${models.length} product models`,
            });
          } else {
            if (abortController.signal.aborted) {
              return;
            }
            toast({
              title: t("no_results_found") || "No Results",
              description: t("no_products_found_from_web") || "No products found from web search",
              variant: "destructive",
            });
          }
        } else {
          // Check before showing toast
          if (abortController.signal.aborted) {
            return;
          }
          toast({
            title: t("generation_failed") || "Failed",
            description: data.message || t("ai_generation_error") || "AI generation error",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      // Don't show error toast if request was aborted
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      toast({
        title: t("generation_failed") || "Failed",
        description: error.message || t("ai_generation_error") || "AI generation error",
        variant: "destructive",
      });
    } finally {
      // Always clear the loading state if this request was aborted
      if (abortController.signal.aborted) {
        setIsAIGenerating(false);
        // Only clear ref if it's still pointing to this controller
        if (aiAbortControllerRef.current === abortController) {
          aiAbortControllerRef.current = null;
        }
      } else if (aiAbortControllerRef.current === abortController) {
        // Normal completion - only clear if this is still the current request
        setIsAIGenerating(false);
        aiAbortControllerRef.current = null;
      }
    }
  }, [toast, t]);

  const handleSkipLoading = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setIsAIGenerating(false);
    setAutoAISearchTriggered(false);
    setAiSearchSkipped(true); // Mark that user skipped AI search
  };

  // Handle Image Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
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

  // Handle Image Recognition
  const handleImageRecognition = async () => {
    if (!selectedImage) {
      toast({
        title: t("please_select_image") || "Please select image",
        variant: "destructive",
      });
      return;
    }
    await handleAIGenerate(selectedImage, 'image');
  };

  // Handle URL Import
  const handleImportFromUrl = async () => {
    if (!productUrl.trim()) {
      toast({
        title: t("please_enter_url") || "Please enter URL",
        variant: "destructive",
      });
      return;
    }
    await handleAIGenerate(productUrl, 'url');
  };

  // Handle using preview data
  const handleUsePreviewData = () => {
    if (previewData) {
      // Build categoryLocation string from path
      const categoryLocation = previewData.categoryPath?.join(',') || '';
      
      // Encode the data properly for URL
      const encodedData = encodeURIComponent(JSON.stringify({
        ...previewData,
        matchedCategoryId: previewData.matchedCategoryId || null,
        categoryConfidence: previewData.categoryConfidence || 'low',
        categoryPath: previewData.categoryPath || [],
        categoryLocation: categoryLocation,
      }));
      
      // Build URL with category path if available
      const url = new URL('/product', window.location.origin);
      url.searchParams.set('autoFill', 'true');
      url.searchParams.set('data', encodedData);
      if (previewData.categoryPath?.length) {
        url.searchParams.set('selectedCategoryIds', previewData.categoryPath.join(','));
      }
      
      router.push(url.pathname + url.search);
      setShowPreviewModal(false);
    }
  };

  // Handle selecting a model - check existence and generate details
  const handleSelectModel = async (model: string | {modelName: string; specifications: string}) => {
    const modelName = typeof model === 'string' ? model : model.modelName;
    setSelectedModel(modelName);
    setCheckingModel(true);
    setModelExists(null);
    const modelIndex = aiProductModels.findIndex(m => {
      const mName = typeof m === 'string' ? m : m.modelName;
      return mName === modelName;
    });
    setProcessingProductIndex(modelIndex >= 0 ? modelIndex : null);
    
    try {
      const token = getCookie(PUREMOON_TOKEN_KEY);
      
      // Step 1: Check if model exists
      const checkResponse = await fetch(`${getApiUrl()}/product/check-model-exists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          modelName: modelName,
        }),
      });
      
      const checkData = await checkResponse.json();
      
      if (!checkData.status) {
        toast({
          title: t("check_failed") || "Failed",
          description: checkData.message || t("failed_to_check_model") || "Failed to check model existence",
          variant: "destructive",
        });
        return;
      }
      
      setModelExists(checkData.exists);
      
      // Step 2: Generate full details regardless of existence
      const detailsResponse = await fetch(`${getApiUrl()}/product/ai-generate-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: modelName,
        }),
      });
      
      const detailsData = await detailsResponse.json();
      
      if (!detailsData.status || !detailsData.data) {
        toast({
          title: t("generation_failed") || "Failed",
          description: detailsData.message || t("failed_to_generate_details") || "Failed to generate product details",
          variant: "destructive",
        });
        return;
      }

      // Use AI to find matching category (always prefer our leaf-only matcher)
      let matchedCategoryId: number | null = null;
      let categoryConfidence = 'low';
      let categoryPath: number[] | null = null;
      
      if (detailsData.data.category) {
        const matchResult = await findMatchingCategoryWithAI(detailsData.data.category, modelName);
        matchedCategoryId = matchResult.matchedCategoryId;
        categoryConfidence = matchResult.confidence;
      }
      
      // Fallback: if our matcher failed but backend provided an ID, use it with lower confidence
      if (!matchedCategoryId && detailsData.data.matchedCategoryId) {
        matchedCategoryId = detailsData.data.matchedCategoryId;
        categoryConfidence = 'medium';
      }
      
      // If category matched, find the full path in hierarchy
      if (matchedCategoryId && categoriesQuery?.data?.data?.children) {
        categoryPath = findCategoryPathInHierarchy(
          categoriesQuery.data.data.children, 
          matchedCategoryId
        );
      }
      
      setPreviewData({
        ...detailsData.data,
        matchedCategoryId: matchedCategoryId,
        categoryConfidence: categoryConfidence,
        categoryPath: categoryPath,
        modelExists: checkData.exists,
      });
      setShowPreviewModal(true);
    } catch (error: any) {
      toast({
        title: t("generation_failed") || "Failed",
        description: error.message || t("ai_generation_error") || "AI generation error",
        variant: "destructive",
      });
    } finally {
      setCheckingModel(false);
      setProcessingProductIndex(null);
    }
  };

  // Handle selecting a product suggestion (for image/URL flows)
  const handleSelectSuggestion = async (product: any, index: number) => {
    setProcessingProductIndex(index);
    setSelectedModel(product.productName);
    setCheckingModel(true);
    setModelExists(null);

    try {
      const token = getCookie(PUREMOON_TOKEN_KEY);

      // STEP 1: Check if this suggested model already exists
      const checkResponse = await fetch(`${getApiUrl()}/product/check-model-exists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modelName: product.productName,
        }),
      });

      const checkData = await checkResponse.json();

      if (!checkData.status) {
        toast({
          title: t("check_failed") || "Failed",
          description:
            checkData.message ||
            t("failed_to_check_model") ||
            "Failed to check model existence",
          variant: "destructive",
        });
        return;
      }

      setModelExists(checkData.exists);

      // STEP 2: Generate full product details
      const response = await fetch(`${getApiUrl()}/product/ai-generate-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: product.productName,
          category: product.category,
          brand: product.brand,
        }),
      });

      const detailsData = await response.json();

      if (!detailsData.status || !detailsData.data) {
        toast({
          title: t("generation_failed") || "Failed",
          description:
            detailsData.message ||
            t("failed_to_generate_details") ||
            "Failed to generate product details",
          variant: "destructive",
        });
        return;
      }

      // STEP 3: AI category matching (leaf-only), using product name as context
      let matchedCategoryId: number | null = null;
      let categoryConfidence = "low";
      let categoryPath: number[] | null = null;

      if (detailsData.data.category) {
        const matchResult = await findMatchingCategoryWithAI(
          detailsData.data.category,
          product.productName
        );
        matchedCategoryId = matchResult.matchedCategoryId;
        categoryConfidence = matchResult.confidence;
      }

      // STEP 4: Fallback: backend matchedCategoryId if our matcher failed
      if (!matchedCategoryId && detailsData.data.matchedCategoryId) {
        matchedCategoryId = detailsData.data.matchedCategoryId;
        categoryConfidence = "medium";
      }

      // STEP 5: Build full category path from matched leaf
      if (matchedCategoryId && categoriesQuery?.data?.data?.children) {
        categoryPath = findCategoryPathInHierarchy(
          categoriesQuery.data.data.children,
          matchedCategoryId
        );
      }

      // STEP 6: Open preview with same structure as text flow
      setPreviewData({
        ...detailsData.data,
        matchedCategoryId,
        categoryConfidence,
        categoryPath,
        modelExists: checkData.exists,
      });
      setShowPreviewModal(true);
    } catch (error: any) {
      toast({
        title: t("generation_failed") || "Failed",
        description:
          error.message || t("ai_generation_error") || "AI generation error",
        variant: "destructive",
      });
    } finally {
      setProcessingProductIndex(null);
      setCheckingModel(false);
    }
  };

  // Handle search results from the query
  useEffect(() => {
    if (isError) {
      toast({
        title: t("search_failed"),
        description: t("search_failed"),
        variant: "destructive",
      });
      setIsSearching(false);
      setSearchResults([]);
      // Auto-trigger AI search if no existing products found (and user hasn't skipped)
      if (querySearchTerm.trim().length >= 3 && !autoAISearchTriggered && !isAIGenerating && !aiSearchSkipped) {
        setAutoAISearchTriggered(true);
        handleAIGenerate(querySearchTerm, 'text');
      }
    } else if (searchData?.data) {
      const results = searchData.data;
      setSearchResults(results);
      setIsSearching(false);
      // Auto-trigger AI search if no existing products found (and user hasn't skipped)
      if (results.length === 0 && querySearchTerm.trim().length >= 3 && !autoAISearchTriggered && !isAIGenerating && !aiSearchSkipped) {
        setAutoAISearchTriggered(true);
        handleAIGenerate(querySearchTerm, 'text');
      }
    } else if (querySearchTerm.trim().length >= 3 && shouldSearch && searchData && !searchData.data) {
      setIsSearching(false);
      setSearchResults([]);
      // Auto-trigger AI search if no existing products found (and user hasn't skipped)
      if (!autoAISearchTriggered && !isAIGenerating && !aiSearchSkipped) {
        setAutoAISearchTriggered(true);
        handleAIGenerate(querySearchTerm, 'text');
      }
    }
  }, [searchData, querySearchTerm, shouldSearch, isError, error, toast, t, autoAISearchTriggered, isAIGenerating, handleAIGenerate, aiSearchSkipped]);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("add_product")}
              </h1>
            </div>
            
            {/* Add New Product Button */}
            <Button
              onClick={handleAddNewProduct}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {/* Updated label per request */}
              {t("manually_add_new_product") || "Manually add a new product"}
            </Button>
          </div>
        </div>

        {/* Enhanced Search Section with Tabs */}
        <div className="bg-white rounded-lg shadow-xs p-6 mb-6">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                {/* Renamed tab: Add product using AI */}
                {t("add_product_using_ai") || "Add product using AI"}
              </TabsTrigger>
              <TabsTrigger value="image">
                <Camera className="h-4 w-4 mr-2" />
                {t("image")}
              </TabsTrigger>
              {/* <TabsTrigger value="url">
                <LinkIcon className="h-4 w-4 mr-2" />
                {t("url")}
              </TabsTrigger> */}
            </TabsList>

            {/* Search Tab - Existing Functionality */}
            <TabsContent value="search" className="mt-0">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3" dir={langDir}>
              {t("search_existing_product_description")}
            </p>
            <div className="flex gap-2 w-full">
              <Input
                type="text"
                placeholder={t("enter_product_name")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[600px]"
                dir={langDir}
              />
              <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? t("searching") : t("search") || "Search"}
              </Button>
            </div>
          </div>

              {/* Search Results - Existing */}
          {searchResults.length > 0 && (
                <div className="space-y-3 mb-6">
              <h4 className="font-medium text-gray-900" dir={langDir}>
                {t("product_suggestion_from_ultrasooq") || "Product suggestion from Ultrasooq"}
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {product.existingProductImages?.[0]?.image ? (
                        <Image
                          src={product.existingProductImages[0].image}
                          alt={product.productName}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <Copy className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900" dir={langDir}>
                        {product.productName}
                      </h5>
                      <p className="text-xs text-gray-400" dir={langDir}>
                        {product.category?.name} • {product.brand?.brandName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewProduct(product)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t("view")}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {t("select")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More with AI Button - Show below existing results */}
              {!isAIGenerating && aiProductModels.length === 0 && (
                <div className="flex justify-center pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => handleAIGenerate(searchTerm || '', 'text')}
                    className="bg-info hover:bg-info/90 text-white"
                    disabled={!searchTerm.trim()}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t("load_more_with_ai") || "Load More with AI"}
                  </Button>
                </div>
              )}
              
              {/* Show loading state if AI is generating */}
              {isAIGenerating && (
                <div className="flex flex-col items-center gap-2 pt-4 border-t border-gray-200">
                  <Button disabled className="bg-info text-white">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("generating") || "Generating..."}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSkipLoading}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {t("skip_loading") || "Skip loading"}
                  </Button>
                </div>
              )}
            </div>
          )}

              {/* AI Product Models List - Show below existing results (TEXT source only) */}
              {aiProductModels.length > 0 && aiModelSource === "text" && (
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2" dir={langDir}>
                      <Sparkles className="h-5 w-5 text-info" />
                      {t("product_models_found") || "Product Models Found"}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAIGenerate(searchTerm || '', 'text')}
                      disabled={isAIGenerating || !searchTerm.trim()}
                      className="text-info hover:text-info hover:bg-info/5"
                    >
                      {isAIGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {aiProductModels.map((model, idx) => {
                      const modelName = typeof model === 'string' ? model : model.modelName;
                      const specifications = typeof model === 'string' ? '' : model.specifications;
                      
                      return (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {specifications ? (
                                <div className="text-sm text-gray-700" dir={langDir}>
                                  <span className="font-semibold text-gray-900">{modelName}</span>
                                  <span className="text-gray-600 mx-1">-</span>
                                  <span className="text-gray-700">
                                    {specifications
                                      .split('\n')
                                      .filter(line => line.trim())
                                      .map((spec) => {
                                        // Extract value from "Label: Value" format
                                        const colonIndex = spec.indexOf(':');
                                        if (colonIndex > 0) {
                                          return spec.substring(colonIndex + 1).trim();
                                        }
                                        return spec.trim();
                                      })
                                      .filter(value => value.length > 0)
                                      .join(', ')}
                                  </span>
                                </div>
                              ) : (
                                <h5 className="font-semibold text-gray-900" dir={langDir}>
                                  {modelName}
                                </h5>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSelectModel(model)}
                              disabled={checkingModel || processingProductIndex === idx}
                              className="bg-info hover:bg-info/90 text-white flex-shrink-0 ml-4"
                            >
                              {checkingModel && processingProductIndex === idx ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {t("checking_and_generating") || "Checking & Generating..."}
                                </>
                              ) : (
                                t("select") || "Select"
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Results Found - Only show if no AI models either */}
              {shouldSearch && querySearchTerm && searchResults.length === 0 && !isSearching && aiProductModels.length === 0 && (
            <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2" dir={langDir}>
                {t("no_products_found")}
              </p>
                  <p className="text-sm text-gray-500 mb-4" dir={langDir}>
                    {t("no_matching_products_in_catalog") || t("try_different_search_term")}
              </p>
                  {/* Load More with AI Button - Show when no existing results */}
                  {!isAIGenerating && (
                    <Button
                      onClick={() => handleAIGenerate(searchTerm || '', 'text')}
                      className="bg-info hover:bg-info/90 text-white"
                      disabled={!searchTerm.trim()}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t("load_more_with_ai") || "Load More with AI"}
                    </Button>
                  )}
                  {isAIGenerating && (
                    <div className="flex flex-col items-center gap-2">
                      <Button disabled className="bg-info text-white">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("generating") || "Generating..."}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSkipLoading}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {t("skip_loading") || "Skip loading"}
                      </Button>
                    </div>
                  )}
            </div>
          )}

              {/* Initial State - Existing */}
          {!searchTerm && searchResults.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2" dir={langDir}>
                  {t("search_existing_product_description")}
                </p>
                <p className="text-sm text-gray-400" dir={langDir}>
                  {t("enter_product_name_to_search")}
                </p>
              </div>
            </div>
          )}
            </TabsContent>

            {/* Image Tab - New Feature */}
            <TabsContent value="image" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2" dir={langDir}>
                    {t("scan_product_image") || "Scan Product Image"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4" dir={langDir}>
                    {t("upload_product_photo_ai_will_analyze_and_fill_details") || "Upload product photo, AI will analyze and fill details"}
                  </p>
                </div>

                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-recognition"
                  />
                  <label
                    htmlFor="image-recognition"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {imagePreview ? (
                      <div className="relative w-48 h-48 mx-auto mb-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-10 w-10 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 mb-2">
                          {t("click_to_upload_or_drag_drop") || "Click to upload or drag & drop"}
                        </span>
                      </>
                    )}
                    {!imagePreview && (
                      <Button variant="outline" size="sm" asChild>
                        <span>{t("choose_file") || "Choose File"}</span>
                      </Button>
                    )}
                  </label>
                </div>

                {/* Process Button */}
                {imagePreview && (
                  <Button
                    onClick={handleImageRecognition}
                    disabled={isAIGenerating}
                    className="w-full bg-info hover:bg-info/90 text-white"
                  >
                    {isAIGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("analyzing_with_ai") || "Analyzing with AI..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t("analyze_with_ai") || "Analyze with AI"}
                      </>
                    )}
                  </Button>
                )}

                {/* AI Product Suggestions List - Show after image analysis (if any) */}
                {aiProductSuggestions.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2" dir={langDir}>
                        <Sparkles className="h-5 w-5 text-info" />
                        {t("product_suggestions_from_web") || "Product Suggestions from Web"}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedImage) {
                            handleAIGenerate(selectedImage, 'image');
                          } else if (searchTerm) {
                            handleAIGenerate(searchTerm, 'text');
                          }
                        }}
                        disabled={isAIGenerating || (!selectedImage && !searchTerm.trim())}
                        className="text-info hover:text-info hover:bg-info/5"
                      >
                        {isAIGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {aiProductSuggestions.map((product, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-semibold text-gray-900" dir={langDir}>
                                  {product.productName || product.name}
                                </h5>
                                <Button
                                  size="sm"
                                  onClick={() => handleSelectSuggestion(product, idx)}
                                  disabled={processingProductIndex === idx}
                                  className="bg-info hover:bg-info/90 text-white"
                                >
                                  {processingProductIndex === idx ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      {t("generating") || "Generating..."}
                                    </>
                                  ) : (
                                    t("use") || "Use"
                                  )}
                                </Button>
                              </div>
                              
                              {/* Source Information */}
                              <div className="flex items-center gap-2 mb-2">
                                <LinkIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-xs font-medium text-info">
                                  {product.sourceName || "Unknown Source"}
                                </span>
                              </div>

                              {/* Product Details */}
                              <div className="space-y-1 text-sm text-gray-600">
                                {product.category && (
                                  <p className="font-medium text-gray-900">
                                    {t("category")}: {product.category}
                                  </p>
                                )}
                                {product.brand && (
                                  <p>
                                    {t("brand")}: {product.brand}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Product Models from IMAGE source */}
                {aiProductModels.length > 0 && aiModelSource === "image" && (
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center justify-between">
                      <h4
                        className="font-medium text-gray-900 flex items-center gap-2"
                        dir={langDir}
                      >
                        <Sparkles className="h-5 w-5 text-info" />
                        {t("product_models_found") || "Product Models Found"}
                      </h4>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {aiProductModels.map((model, idx) => {
                        const modelName =
                          typeof model === "string" ? model : model.modelName;
                        const specifications =
                          typeof model === "string" ? "" : model.specifications;

                        return (
                          <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {specifications ? (
                                  <div
                                    className="text-sm text-gray-700"
                                    dir={langDir}
                                  >
                                    <span className="font-semibold text-gray-900">
                                      {modelName}
                                    </span>
                                    <span className="text-gray-600 mx-1">-</span>
                                    <span className="text-gray-700">
                                      {specifications
                                        .split("\n")
                                        .filter((line) => line.trim())
                                        .map((spec) => {
                                          const colonIndex = spec.indexOf(":");
                                          if (colonIndex > 0) {
                                            return spec
                                              .substring(colonIndex + 1)
                                              .trim();
                                          }
                                          return spec.trim();
                                        })
                                        .filter((value) => value.length > 0)
                                        .join(", ")}
                                    </span>
                                  </div>
                                ) : (
                                  <h5
                                    className="font-semibold text-gray-900"
                                    dir={langDir}
                                  >
                                    {modelName}
                                  </h5>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleSelectModel(model)}
                                disabled={
                                  checkingModel || processingProductIndex === idx
                                }
                                className="bg-info hover:bg-info/90 text-white flex-shrink-0 ml-4"
                              >
                                {checkingModel &&
                                processingProductIndex === idx ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("checking_and_generating") ||
                                      "Checking & Generating..."}
                                  </>
                                ) : (
                                  t("select") || "Select"
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* URL Tab - New Feature */}
            {false && (
            <TabsContent value="url" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2" dir={langDir}>
                    {t("import_from_url") || "Import from URL"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4" dir={langDir}>
                    {t("paste_product_link_ai_will_extract_product_data") || "Paste product link, AI will extract product data"}
                  </p>
                </div>

                {/* URL Input */}
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://amazon.com/product/..."
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="flex-1"
                    dir={langDir}
                  />
                  <Button
                    onClick={handleImportFromUrl}
                    disabled={!productUrl || isAIGenerating}
                    className="bg-info hover:bg-info/90 text-white"
                  >
                    {isAIGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("extracting") || "Extracting..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t("extract_with_ai") || "Extract with AI"}
                      </>
                    )}
                  </Button>
                </div>

                {/* Info */}
                <div className="bg-info/5 border border-info/20 rounded-lg p-3">
                  <p className="text-xs text-info" dir={langDir}>
                    {t("ai_will_scrape_url_and_extract_product_information") || "AI will scrape URL and extract product information"}
                  </p>
                </div>
              </div>
            </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Product Details Popup */}
      {showProductPopup && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900" dir={langDir}>
                {t("product_details")}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeProductPopup}
                className="p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Popup Content */}
            <div className="p-6">
              {/* Product Images */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3" dir={langDir}>
                  {t("product_images")}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedProduct.existingProductImages && selectedProduct.existingProductImages.length > 0 ? (
                    selectedProduct.existingProductImages.map((image: any, index: number) => {
                      const imageSrc = image.image;
                      const isExternalUrl = imageSrc && 
                        typeof imageSrc === "string" && 
                        imageSrc.startsWith("http") && 
                        !imageSrc.includes("puremoon.s3.amazonaws.com");
                      
                      return (
                        <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                          {isExternalUrl ? (
                            <img
                              src={imageSrc}
                              alt={`${selectedProduct.productName} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/images/no-image.jpg";
                              }}
                            />
                          ) : (
                            <Image
                              src={imageSrc}
                              alt={`${selectedProduct.productName} - Image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      {t("no_images_available")}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div className="space-y-4">
                <div>
                  {/* <h4 className="font-medium text-gray-900 mb-3" dir={langDir}>
                    {t("product_information")}
                  </h4> */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600" dir={langDir}>
                        {t("product_name")}
                      </label>
                      <p className="text-gray-900 mt-1" dir={langDir}>
                        {selectedProduct.productName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600" dir={langDir}>
                        {t("category")}
                      </label>
                      <p className="text-gray-900 mt-1" dir={langDir}>
                        {selectedProduct.category?.name || t("not_specified")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600" dir={langDir}>
                        {t("brand")}
                      </label>
                      <p className="text-gray-900 mt-1" dir={langDir}>
                        {selectedProduct.brand?.brandName || t("not_specified")}
                      </p>
                    </div>
                    {/* <div>
                      <label className="text-sm font-medium text-gray-600" dir={langDir}>
                        {t("product_id")}
                      </label>
                      <p className="text-gray-900 mt-1 font-mono">
                        {selectedProduct.id}
                      </p>
                    </div> */}
                  </div>
                </div>

                {/* Short Description */}
                {selectedProduct.shortDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-600" dir={langDir}>
                      {t("short_description")}
                    </label>
                    <p className="text-gray-900 mt-1" dir={langDir}>
                      {selectedProduct.shortDescription}
                    </p>
                  </div>
                )}

                {/* Full Description */}
                {selectedProduct.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600" dir={langDir}>
                      {t("description_and_specification")}
                    </label>
                    <p className="text-gray-900 mt-1" dir={langDir}>
                      {(() => {
                        try {
                          const desc = typeof selectedProduct.description === 'string' 
                            ? JSON.parse(selectedProduct.description) 
                            : selectedProduct.description;
                          
                          if (Array.isArray(desc)) {
                            const textContent = desc
                              .filter(item => item.type === 'p' && item.children)
                              .flatMap(item => item.children)
                              .map(child => child.text)
                              .join(' ');
                            return textContent || 'No description available';
                          }
                          
                          return selectedProduct.description;
                        } catch (error) {
                          return selectedProduct.description;
                        }
                      })()}
                    </p>
                  </div>
                )}

                {/* Additional Details */}
                {selectedProduct.specifications && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3" dir={langDir}>
                      {t("specifications")}
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap" dir={langDir}>
                        {JSON.stringify(selectedProduct.specifications, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Popup Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={closeProductPopup}>
                {t("close")}
              </Button>
              <Button 
                onClick={() => {
                  closeProductPopup();
                  handleSelectProduct(selectedProduct);
                }}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("select")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Preview Modal - New */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900" dir={langDir}>
                {t("review_product_data") || "Review Product Data"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {t("suggested_product_name") || "Suggested Product Name"}
                  </label>
                  <p className="text-gray-900 mt-1">{previewData.productName || previewData.name || t("not_specified")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {t("approx_price_use_your_own") || "Approx price(use your own price)"}
                  </label>
                  <p className="text-gray-900 mt-1">{previewData.price || previewData.estimatedPrice || t("not_specified")}</p>
                </div>
                {previewData.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      {t("description")}
                    </label>
                    <p className="text-gray-900 mt-1">{previewData.description}</p>
                  </div>
                )}
                {previewData.category && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      {t("category")}
                    </label>
                    <div className="mt-1">
                      <p className="text-gray-900">{previewData.category}</p>
                      {previewData.matchedCategoryId ? (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${
                          previewData.categoryConfidence === 'high' 
                            ? 'text-success' 
                            : previewData.categoryConfidence === 'medium'
                            ? 'text-primary'
                            : 'text-warning'
                        }`}>
                          <CheckCircle2 className="h-3 w-3" />
                          {previewData.categoryConfidence === 'high' 
                            ? (t("category_matched") || "Category matched - will be auto-selected")
                            : previewData.categoryConfidence === 'medium'
                            ? (t("category_suggested") || "Category suggested - please verify")
                            : (t("category_low_confidence") || "Category match uncertain - please verify")
                          }
                        </p>
                      ) : (
                        <p className="text-xs text-warning mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {t("category_not_matched") || "Category not found - please select manually"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {previewData.brand && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t("brand")}
                    </label>
                    <p className="text-gray-900 mt-1">{previewData.brand}</p>
                  </div>
                )}
                {previewData.shortDescription && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      {t("short_description")}
                    </label>
                    <p className="text-gray-900 mt-1">{previewData.shortDescription}</p>
                  </div>
                )}
                {previewData.specifications && Array.isArray(previewData.specifications) && previewData.specifications.length > 0 && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      {t("specifications")}
                    </label>
                    <div className="mt-1 space-y-2">
                      {previewData.specifications.map((spec: any, idx: number) => (
                        <div key={idx} className="flex gap-2 text-sm">
                          <span className="font-medium text-gray-700">{spec.label}:</span>
                          <span className="text-gray-900">{spec.specification}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {previewData.modelExists !== null && (
                  <div className={`col-span-2 p-3 rounded-lg ${
                    previewData.modelExists 
                      ? 'bg-warning/5 border border-warning/20' 
                      : 'bg-success/5 border border-success/20'
                  }`}>
                    <p className={`text-sm font-medium ${
                      previewData.modelExists 
                        ? 'text-warning' 
                        : 'text-success'
                    }`}>
                      {previewData.modelExists 
                        ? t("model_exists_in_system") || "⚠️ This model already exists in your product catalog"
                        : t("model_new") || "✅ This is a new model"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleUsePreviewData} className="bg-info hover:bg-info/90 text-white">
                {t("use_this_data") || "Use This Data"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withActiveUserGuard(AddFromExistingProductPage);
