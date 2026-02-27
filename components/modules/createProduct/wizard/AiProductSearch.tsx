"use client";
import React, { useState, useCallback, useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/apis/queries/user.queries";
import { useExistingProduct } from "@/apis/queries/product.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { useToast } from "@/components/ui/use-toast";
import { PRODUCT_CATEGORY_ID, ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import {
  Search,
  Copy,
  Eye,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import { getCookie } from "cookies-next";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiProductSearchHandle {
  triggerTextSearch: (query: string) => void;
  triggerImageScan: (file: File) => void;
}

interface AiProductSearchProps {
  /** Called when the user selects AI-generated data or an existing product */
  onProductDataReady: (aiData: any) => void;
}

interface ModelEntry {
  modelName: string;
  specifications: string;
}

// ---------------------------------------------------------------------------
// Helpers (copied from add-from-existing)
// ---------------------------------------------------------------------------

/** Build brief specs string from an AI product suggestion */
function buildSpecsFromProductSuggestion(product: any): string {
  const lines: string[] = [];
  if (product.brand) lines.push(`Brand: ${product.brand}`);
  if (product.category) lines.push(`Category: ${product.category}`);
  const price = product.estimatedPrice ?? product.price;
  if (price) lines.push(`Price: ${price}`);
  if (Array.isArray(product.specifications)) {
    for (const spec of product.specifications.slice(0, 3)) {
      if (spec.label && spec.specification)
        lines.push(`${spec.label}: ${spec.specification}`);
    }
  }
  return lines.join("\n");
}

/** Flatten category tree, marking leaves */
function flattenCategories(
  categories: any[],
  parentPath: number[] = [],
): Array<{ id: number; name: string; isLeaf: boolean }> {
  const result: Array<{ id: number; name: string; isLeaf: boolean }> = [];
  for (const cat of categories) {
    const currentPath = [...parentPath, cat.id];
    const hasChildren = cat.children && cat.children.length > 0;
    result.push({ id: cat.id, name: cat.name, isLeaf: !hasChildren });
    if (hasChildren)
      result.push(...flattenCategories(cat.children, currentPath));
  }
  return result;
}

/** Walk up category tree to build full path from root to target */
function findCategoryPathInHierarchy(
  categories: any[],
  targetId: number | string,
  currentPath: number[] = [],
): number[] | null {
  for (const category of categories) {
    const newPath = [...currentPath, category.id];
    if (
      category.id?.toString() === targetId?.toString() ||
      Number(category.id) === Number(targetId)
    )
      return newPath;
    if (category.children?.length) {
      const found = findCategoryPathInHierarchy(
        category.children,
        targetId,
        newPath,
      );
      if (found) return found;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AiProductSearch = forwardRef<AiProductSearchHandle, AiProductSearchProps>(
  ({ onProductDataReady }, ref) => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const { toast } = useToast();
    const me = useMe();

    // ── Search state ────────────────────────────────────────────────────
    const [querySearchTerm, setQuerySearchTerm] = useState("");
    const [shouldSearch, setShouldSearch] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [lastSearchQuery, setLastSearchQuery] = useState("");

    // ── AI state ────────────────────────────────────────────────────────
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [aiProductModels, setAiProductModels] = useState<ModelEntry[]>([]);
    const [aiModelSource, setAiModelSource] = useState<
      "text" | "image" | null
    >(null);
    const aiAbortControllerRef = useRef<AbortController | null>(null);

    // ── Model selection / preview state ─────────────────────────────────
    const [checkingModel, setCheckingModel] = useState(false);
    const [processingProductIndex, setProcessingProductIndex] = useState<
      number | null
    >(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    // ── Product view popup state ────────────────────────────────────────
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showProductPopup, setShowProductPopup] = useState(false);

    // ── Has any results to show ─────────────────────────────────────────
    const hasResults =
      searchResults.length > 0 ||
      aiProductModels.length > 0 ||
      isSearching ||
      isAIGenerating ||
      (shouldSearch && querySearchTerm);

    // ── Queries ─────────────────────────────────────────────────────────
    const {
      data: searchData,
      isError: isQueryError,
    } = useExistingProduct(
      {
        page: 1,
        limit: 10,
        term: querySearchTerm,
        brandAddedBy: me.data?.data?.id,
      },
      shouldSearch && querySearchTerm.trim().length >= 3,
    );

    // Safety: if query errors out or takes too long, stop the searching state
    useEffect(() => {
      if (isQueryError && isSearching) {
        setIsSearching(false);
      }
    }, [isQueryError, isSearching]);

    // Safety timeout: if isSearching stays true for more than 10 seconds, stop it
    useEffect(() => {
      if (!isSearching) return;
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 10000);
      return () => clearTimeout(timer);
    }, [isSearching]);

    const categoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());

    // ── AI category matching ────────────────────────────────────────────
    const findMatchingCategoryWithAI = useCallback(
      async (
        aiCategoryName: string,
        productName?: string,
      ): Promise<{ matchedCategoryId: number | null; confidence: string }> => {
        if (!categoriesQuery?.data?.data?.children || !aiCategoryName) {
          return { matchedCategoryId: null, confidence: "low" };
        }

        const allCats = flattenCategories(
          categoriesQuery.data.data.children,
        );
        const leafCats = allCats.filter((c) => c.isLeaf);
        const parentCats = allCats.filter((c) => !c.isLeaf);
        const token = getCookie(ULTRASOOQ_TOKEN_KEY);

        try {
          if (leafCats.length > 0) {
            const res = await fetch(
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
                  availableCategories: leafCats.map((c) => ({
                    id: c.id,
                    name: c.name,
                    isLeaf: true,
                  })),
                }),
              },
            );
            const data = await res.json();
            if (data.status && data.data?.matchedCategoryId) {
              return {
                matchedCategoryId: data.data.matchedCategoryId,
                confidence: data.data.confidence || "medium",
              };
            }
          }

          if (parentCats.length === 0)
            return { matchedCategoryId: null, confidence: "low" };

          const res2 = await fetch(
            `${getApiUrl()}/product/ai-match-category`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                aiCategoryName,
                availableCategories: parentCats.map((c) => ({
                  id: c.id,
                  name: c.name,
                  isLeaf: false,
                })),
              }),
            },
          );
          const data2 = await res2.json();
          if (data2.status && data2.data?.matchedCategoryId) {
            return {
              matchedCategoryId: data2.data.matchedCategoryId,
              confidence: data2.data.confidence || "low",
            };
          }
          return { matchedCategoryId: null, confidence: "low" };
        } catch {
          return { matchedCategoryId: null, confidence: "low" };
        }
      },
      [categoriesQuery],
    );

    // ── AI generation (text / image) ────────────────────────────────────
    const handleAIGenerate = useCallback(
      async (input: string | File, type: "text" | "image") => {
        if (aiAbortControllerRef.current) aiAbortControllerRef.current.abort();
        const ac = new AbortController();
        aiAbortControllerRef.current = ac;
        setIsAIGenerating(true);

        try {
          const token = getCookie(ULTRASOOQ_TOKEN_KEY);

          if (type === "text" && typeof input === "string") {
            const res = await fetch(
              `${getApiUrl()}/product/ai-generate-list`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ type: "text", query: input }),
                signal: ac.signal,
              },
            );
            if (ac.signal.aborted) return;
            const data = await res.json();
            if (ac.signal.aborted) return;

            if (data.status && Array.isArray(data.data) && data.data.length > 0) {
              setAiProductModels(data.data);
              setAiModelSource("text");
              toast({
                title: t("search_successful") || "Search Successful",
                description: `Found ${data.data.length} product models`,
              });
            } else if (!ac.signal.aborted) {
              toast({
                title: t("no_results_found") || "No Results",
                description:
                  data.message || "No product models found",
                variant: "destructive",
              });
            }
          } else {
            // Image flow
            const formData = new FormData();
            if (type === "image" && input instanceof File) {
              formData.append("image", input);
              formData.append("type", "image");
            }

            const res = await fetch(`${getApiUrl()}/product/ai-generate`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
              signal: ac.signal,
            });
            if (ac.signal.aborted) return;
            const data = await res.json();
            if (ac.signal.aborted) return;

            if (data.status && data.data) {
              const items = Array.isArray(data.data)
                ? data.data
                : [data.data];
              const models = items
                .map((p: any) => ({
                  modelName: p.productName || p.name || "",
                  specifications: buildSpecsFromProductSuggestion(p),
                }))
                .filter((m: ModelEntry) => m.modelName.trim().length > 0);

              if (models.length > 0) {
                setAiProductModels(models);
                setAiModelSource("image");
                toast({
                  title: t("search_successful") || "Search Successful",
                  description: `Found ${models.length} product models`,
                });
              }
            }
          }
        } catch (err: any) {
          if (err.name === "AbortError" || ac.signal.aborted) return;
          toast({
            title: t("generation_failed") || "Failed",
            description: err.message || "AI generation error",
            variant: "destructive",
          });
        } finally {
          if (aiAbortControllerRef.current === ac) {
            setIsAIGenerating(false);
            aiAbortControllerRef.current = null;
          }
        }
      },
      [toast, t],
    );

    const handleSkipLoading = () => {
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
        aiAbortControllerRef.current = null;
      }
      setIsAIGenerating(false);
    };

    // ── Imperative handle for parent to trigger searches ────────────────
    useImperativeHandle(ref, () => ({
      triggerTextSearch(query: string) {
        if (!query.trim() || query.trim().length < 3) {
          toast({
            title: t("search_term_too_short") || "Search term too short",
            description: "Please enter at least 3 characters",
            variant: "destructive",
          });
          return;
        }
        setAiProductModels([]);
        setSearchResults([]);
        setQuerySearchTerm(query.trim());
        setLastSearchQuery(query.trim());
        setShouldSearch(true);
        setIsSearching(true);
      },
      triggerImageScan(file: File) {
        handleAIGenerate(file, "image");
      },
    }));

    // ── Sync search results & auto-trigger AI model search ──────────────
    useEffect(() => {
      if (!shouldSearch || !querySearchTerm) return;

      if (searchData?.data) {
        const results = searchData.data;
        setSearchResults(results);
        setIsSearching(false);

        // Auto-trigger AI to find all product models in parallel
        // This ensures the user always sees AI model suggestions
        if (aiProductModels.length === 0 && !isAIGenerating) {
          handleAIGenerate(querySearchTerm, "text");
        }
      }
    }, [searchData, querySearchTerm, shouldSearch]);

    // ── Select existing product ─────────────────────────────────────────
    const handleSelectExistingProduct = (product: any) => {
      onProductDataReady({
        productName: product.productName,
        fromExistingProduct: true,
        existingProductId: product.id,
      });
    };

    const handleViewProduct = (product: any) => {
      setSelectedProduct(product);
      setShowProductPopup(true);
    };

    // ── Select model → check DB first → AI fallback → preview ──────────
    const handleSelectModel = useCallback(
      async (model: ModelEntry | string) => {
        const modelName =
          typeof model === "string" ? model : model.modelName;
        setCheckingModel(true);

        const modelIdx = aiProductModels.findIndex((m) => {
          const mName = typeof m === "string" ? m : m.modelName;
          return mName === modelName;
        });
        setProcessingProductIndex(modelIdx >= 0 ? modelIdx : null);

        try {
          const token = getCookie(ULTRASOOQ_TOKEN_KEY);

          // ── Step 1: Check DB first ──────────────────────────────
          const checkRes = await fetch(
            `${getApiUrl()}/product/check-model-exists`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ modelName }),
            },
          );
          const checkData = await checkRes.json();
          if (!checkData.status) {
            toast({
              title: "Failed",
              description: checkData.message || "Failed to check model existence",
              variant: "destructive",
            });
            return;
          }

          // ── Step 2: If found in DB, use DB data directly ────────
          if (checkData.exists && checkData.existingProduct) {
            const dbProduct = checkData.existingProduct;

            // Resolve category path from DB categoryId
            let matchedCategoryId: number | null = dbProduct.categoryId || null;
            let categoryConfidence = matchedCategoryId ? "high" : "low";
            let categoryPath: number[] | null = null;

            if (
              matchedCategoryId &&
              categoriesQuery?.data?.data?.children
            ) {
              categoryPath = findCategoryPathInHierarchy(
                categoriesQuery.data.data.children,
                matchedCategoryId,
              );
            }

            setPreviewData({
              productName: dbProduct.productName,
              description: dbProduct.description || "",
              specifications: dbProduct.specifications || [],
              category: dbProduct.category || "",
              brand: dbProduct.brand || "",
              images: dbProduct.images || [],
              tags: dbProduct.tags || [],
              matchedCategoryId,
              categoryConfidence,
              categoryPath,
              modelExists: true,
              fromDatabase: true,
            });
            setShowPreviewModal(true);
            return;
          }

          // ── Step 3: Not in DB → fall back to AI generation ──────
          const detailsRes = await fetch(
            `${getApiUrl()}/product/ai-generate-details`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ productName: modelName }),
            },
          );
          const detailsData = await detailsRes.json();
          if (!detailsData.status || !detailsData.data) {
            toast({
              title: "Failed",
              description:
                detailsData.message || "Failed to generate product details",
              variant: "destructive",
            });
            return;
          }

          let matchedCategoryId: number | null = null;
          let categoryConfidence = "low";
          let categoryPath: number[] | null = null;

          if (detailsData.data.category) {
            const matchResult = await findMatchingCategoryWithAI(
              detailsData.data.category,
              modelName,
            );
            matchedCategoryId = matchResult.matchedCategoryId;
            categoryConfidence = matchResult.confidence;
          }

          if (!matchedCategoryId && detailsData.data.matchedCategoryId) {
            matchedCategoryId = detailsData.data.matchedCategoryId;
            categoryConfidence = "medium";
          }

          if (
            matchedCategoryId &&
            categoriesQuery?.data?.data?.children
          ) {
            categoryPath = findCategoryPathInHierarchy(
              categoriesQuery.data.data.children,
              matchedCategoryId,
            );
          }

          setPreviewData({
            ...detailsData.data,
            matchedCategoryId,
            categoryConfidence,
            categoryPath,
            modelExists: false,
            fromDatabase: false,
          });
          setShowPreviewModal(true);
        } catch (err: any) {
          toast({
            title: "Failed",
            description: err.message || "AI generation error",
            variant: "destructive",
          });
        } finally {
          setCheckingModel(false);
          setProcessingProductIndex(null);
        }
      },
      [
        aiProductModels,
        categoriesQuery,
        findMatchingCategoryWithAI,
        toast,
      ],
    );

    // ── "Use This Data" from preview modal ──────────────────────────────
    const handleUsePreviewData = () => {
      if (!previewData) return;
      onProductDataReady({
        ...previewData,
        matchedCategoryId: previewData.matchedCategoryId || null,
        categoryConfidence: previewData.categoryConfidence || "low",
        categoryPath: previewData.categoryPath || [],
        categoryLocation: previewData.categoryPath?.join(",") || "",
      });
      setShowPreviewModal(false);
      toast({
        title: t("product_data_loaded") || "Product Data Loaded",
        description:
          t("ai_data_loaded_successfully") ||
          "AI-generated data loaded successfully. Please review and complete the form.",
      });
    };

    // ── If nothing to show, render nothing ──────────────────────────────
    if (!hasResults) return null;

    // ────────────────────────────────────────────────────────────────────
    // RENDER — results only (no search input, no image upload)
    // ────────────────────────────────────────────────────────────────────
    return (
      <>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Sparkles className="h-5 w-5 text-info" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                {t("search_results") || "Search Results"}
              </h3>
              {lastSearchQuery && (
                <p className="text-sm text-muted-foreground">
                  {t("results_for") || "Results for"}{" "}
                  <span className="font-medium text-muted-foreground">
                    &quot;{lastSearchQuery}&quot;
                  </span>
                </p>
              )}
            </div>
            {(searchResults.length > 0 || aiProductModels.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchResults([]);
                  setAiProductModels([]);
                  setShouldSearch(false);
                  setQuerySearchTerm("");
                  setLastSearchQuery("");
                }}
                className="text-muted-foreground hover:text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Loading state */}
            {isSearching && (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-info" />
                <span className="text-sm text-muted-foreground">
                  {t("searching") || "Searching..."}
                </span>
              </div>
            )}

            {/* Existing product results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4
                  className="text-sm font-semibold text-muted-foreground"
                  dir={langDir}
                >
                  {t("product_suggestion_from_ultrasooq") ||
                    "Products from Ultrasooq catalog"}
                </h4>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        {product.existingProductImages?.[0]?.image ? (
                          <Image
                            src={
                              product.existingProductImages[0].image
                            }
                            alt={product.productName}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <Copy className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="truncate text-sm font-medium text-foreground"
                          dir={langDir}
                        >
                          {product.productName}
                        </p>
                        <p
                          className="text-xs text-muted-foreground"
                          dir={langDir}
                        >
                          {product.category?.name} •{" "}
                          {product.brand?.brandName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          {t("view") || "View"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSelectExistingProduct(product)
                          }
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          {t("select") || "Select"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load more with AI */}
                {!isAIGenerating && aiProductModels.length === 0 && (
                  <div className="flex justify-center border-t border-border pt-3">
                    <Button
                      onClick={() =>
                        handleAIGenerate(lastSearchQuery || "", "text")
                      }
                      className="bg-info hover:bg-info/90 text-white"
                      disabled={!lastSearchQuery.trim()}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {t("load_more_with_ai") || "Load More with AI"}
                    </Button>
                  </div>
                )}

                {isAIGenerating && (
                  <div className="flex flex-col items-center gap-2 border-t border-border pt-3">
                    <Button
                      disabled
                      className="bg-info text-white"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("generating") || "Generating..."}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSkipLoading}
                    >
                      {t("skip_loading") || "Skip loading"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* AI Model results */}
            {aiProductModels.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-info" />
                    {t("product_models_found") || "Product Models Found"}
                  </h4>
                  {aiModelSource === "text" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleAIGenerate(lastSearchQuery || "", "text")
                      }
                      disabled={isAIGenerating || !lastSearchQuery.trim()}
                      className="text-info hover:text-info"
                    >
                      {isAIGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {aiProductModels.map((model, idx) => {
                    const modelName =
                      typeof model === "string"
                        ? model
                        : model.modelName;
                    const specs =
                      typeof model === "string"
                        ? ""
                        : model.specifications;

                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-purple-400 hover:shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          {specs ? (
                            <p className="text-sm text-muted-foreground" dir={langDir}>
                              <span className="font-semibold text-foreground">
                                {modelName}
                              </span>
                              <span className="mx-1 text-muted-foreground">
                                –
                              </span>
                              <span>
                                {specs
                                  .split("\n")
                                  .filter((l) => l.trim())
                                  .map((s) => {
                                    const ci = s.indexOf(":");
                                    return ci > 0
                                      ? s.substring(ci + 1).trim()
                                      : s.trim();
                                  })
                                  .filter((v) => v.length > 0)
                                  .join(", ")}
                              </span>
                            </p>
                          ) : (
                            <p
                              className="text-sm font-semibold text-foreground"
                              dir={langDir}
                            >
                              {modelName}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSelectModel(model)}
                          disabled={
                            checkingModel ||
                            processingProductIndex === idx
                          }
                          className="flex-shrink-0 bg-info text-white hover:bg-info/90"
                        >
                          {checkingModel &&
                          processingProductIndex === idx ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              {t("generating") || "Generating..."}
                            </>
                          ) : (
                            t("select") || "Select"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No results found */}
            {shouldSearch &&
              querySearchTerm &&
              searchResults.length === 0 &&
              !isSearching &&
              aiProductModels.length === 0 &&
              !isAIGenerating && (
                <div className="py-6 text-center">
                  <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground" dir={langDir}>
                    {t("no_results_found") || "No Results Found"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground" dir={langDir}>
                    {t("no_products_matching") ||
                      "No products matching your search. Try a different name or use AI to generate."}
                  </p>
                  <Button
                    onClick={() =>
                      handleAIGenerate(lastSearchQuery || "", "text")
                    }
                    variant="outline"
                    className="mt-3 gap-2 border-purple-300 text-info hover:bg-info/5"
                    disabled={!lastSearchQuery.trim()}
                  >
                    <Sparkles className="h-4 w-4" />
                    {t("try_ai_search") || "Try AI Search"}
                  </Button>
                </div>
              )}

            {/* AI generating state (shown separately) */}
            {isAIGenerating &&
              searchResults.length === 0 &&
              aiProductModels.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-info" />
                  <p className="text-sm text-muted-foreground">
                    {t("ai_generating_suggestions") || "AI is generating suggestions..."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkipLoading}
                    className="mt-1"
                  >
                    {t("stop") || "Stop"}
                  </Button>
                </div>
              )}
          </div>
        </div>

        {/* ─── Preview Modal ─────────────────────────────────────────── */}
        {showPreviewModal && previewData && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowPreviewModal(false)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border p-6">
                <h3 className="text-xl font-semibold text-foreground" dir={langDir}>
                  {t("review_product_data") || "Review Product Data"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreviewModal(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("suggested_product_name") || "Product Name"}
                    </label>
                    <p className="mt-1 text-foreground">
                      {previewData.productName ||
                        previewData.name ||
                        t("not_specified")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("approx_price_use_your_own") || "Approx. Price"}
                    </label>
                    <p className="mt-1 text-foreground">
                      {previewData.price ||
                        previewData.estimatedPrice ||
                        t("not_specified")}
                    </p>
                  </div>

                  {previewData.description && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("description") || "Description"}
                      </label>
                      <p className="mt-1 text-sm text-foreground">
                        {previewData.description}
                      </p>
                    </div>
                  )}

                  {previewData.category && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("category") || "Category"}
                      </label>
                      <div className="mt-1">
                        <p className="text-foreground">{previewData.category}</p>
                        {previewData.matchedCategoryId ? (
                          <p
                            className={`mt-1 flex items-center gap-1 text-xs ${
                              previewData.categoryConfidence === "high"
                                ? "text-success"
                                : previewData.categoryConfidence === "medium"
                                  ? "text-primary"
                                  : "text-warning"
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {previewData.categoryConfidence === "high"
                              ? t("category_matched") ||
                                "Category matched – will be auto-selected"
                              : previewData.categoryConfidence === "medium"
                                ? t("category_suggested") ||
                                  "Category suggested – please verify"
                                : t("category_low_confidence") ||
                                  "Uncertain – please verify"}
                          </p>
                        ) : (
                          <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                            <X className="h-3 w-3" />
                            {t("category_not_matched") ||
                              "Not found – please select manually"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {previewData.brand && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("brand") || "Brand"}
                      </label>
                      <p className="mt-1 text-foreground">{previewData.brand}</p>
                    </div>
                  )}

                  {previewData.shortDescription && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("short_description") || "Short Description"}
                      </label>
                      <p className="mt-1 text-sm text-foreground">
                        {previewData.shortDescription}
                      </p>
                    </div>
                  )}

                  {previewData.specifications?.length > 0 && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("specifications") || "Specifications"}
                      </label>
                      <div className="mt-1 space-y-1">
                        {previewData.specifications.map(
                          (spec: any, i: number) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span className="font-medium text-muted-foreground">
                                {spec.label}:
                              </span>
                              <span className="text-foreground">
                                {spec.specification}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {previewData.modelExists !== null && (
                    <div
                      className={`col-span-2 rounded-lg p-3 ${
                        previewData.fromDatabase
                          ? "border border-info/20 bg-info/5"
                          : previewData.modelExists
                            ? "border border-warning/20 bg-warning/5"
                            : "border border-success/20 bg-success/5"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          previewData.fromDatabase
                            ? "text-info"
                            : previewData.modelExists
                              ? "text-warning"
                              : "text-success"
                        }`}
                      >
                        {previewData.fromDatabase
                          ? "Details loaded from database (no AI needed)"
                          : previewData.modelExists
                            ? "This model already exists in your catalog"
                            : "This is a new model (details generated by AI)"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border p-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                >
                  {t("cancel") || "Cancel"}
                </Button>
                <Button
                  onClick={handleUsePreviewData}
                  className="bg-info text-white hover:bg-info/90"
                >
                  {t("use_this_data") || "Use This Data"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Existing Product View Popup ───────────────────────────── */}
        {showProductPopup && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card">
              <div className="flex items-center justify-between border-b border-border p-6">
                <h3 className="text-xl font-semibold text-foreground" dir={langDir}>
                  {t("product_details") || "Product Details"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowProductPopup(false);
                    setSelectedProduct(null);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-4 p-6">
                {selectedProduct.existingProductImages?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.existingProductImages.map(
                      (img: any, i: number) => (
                        <div
                          key={i}
                          className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                        >
                          <Image
                            src={img.image}
                            alt={`${selectedProduct.productName} ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ),
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("product_name") || "Product Name"}
                    </label>
                    <p className="mt-1 text-foreground">
                      {selectedProduct.productName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("category") || "Category"}
                    </label>
                    <p className="mt-1 text-foreground">
                      {selectedProduct.category?.name || t("not_specified")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("brand") || "Brand"}
                    </label>
                    <p className="mt-1 text-foreground">
                      {selectedProduct.brand?.brandName || t("not_specified")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border p-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowProductPopup(false);
                    setSelectedProduct(null);
                  }}
                >
                  {t("close") || "Close"}
                </Button>
                <Button
                  onClick={() => {
                    setShowProductPopup(false);
                    handleSelectExistingProduct(selectedProduct);
                  }}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t("select") || "Select"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

AiProductSearch.displayName = "AiProductSearch";

export default AiProductSearch;
