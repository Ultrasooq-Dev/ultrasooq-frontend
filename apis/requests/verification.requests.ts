import http from "@/apis/http";

export const extractCR = (crDocumentUrl: string) =>
  http.post("/verification/cr/extract", { crDocumentUrl });

export const runCRPipeline = (data: { crDocumentUrl: string; userId?: number }) =>
  http.post("/verification/cr/pipeline", data);

export const matchCategories = (businessActivities: string[]) =>
  http.post("/verification/cr/match-categories", { businessActivities });

export const suggestProducts = (categoryIds: number[]) =>
  http.get("/verification/cr/suggest-products", { params: { categoryIds: categoryIds.join(",") } });

export const testCRVerification = (userId: number) =>
  http.post("/verification/cr/test", { userId });
