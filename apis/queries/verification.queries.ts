import { useMutation } from "@tanstack/react-query";
import { extractCR, runCRPipeline, matchCategories, testCRVerification } from "../requests/verification.requests";

export const useExtractCR = () =>
  useMutation({
    mutationFn: async (crDocumentUrl: string) => {
      const res = await extractCR(crDocumentUrl);
      return res.data;
    },
  });

export const useRunCRPipeline = () =>
  useMutation({
    mutationFn: async (data: { crDocumentUrl: string; userId?: number }) => {
      const res = await runCRPipeline(data);
      return res.data;
    },
  });

export const useMatchCategories = () =>
  useMutation({
    mutationFn: async (businessActivities: string[]) => {
      const res = await matchCategories(businessActivities);
      return res.data;
    },
  });

export const useTestCRVerification = () =>
  useMutation({
    mutationFn: async (userId: number) => {
      const res = await testCRVerification(userId);
      return res.data;
    },
  });
