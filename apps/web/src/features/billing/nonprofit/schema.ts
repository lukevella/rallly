import * as z from "zod";
import {
  MAX_DOCUMENTS,
  nonprofitDocumentAssetProfile,
} from "@/features/billing/nonprofit/constants";
import { normalizeWebsite } from "@/features/billing/nonprofit/utils";

export const signNonprofitDocumentUploadSchema = z.object({
  fileType: z.enum(nonprofitDocumentAssetProfile.accept),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(nonprofitDocumentAssetProfile.maxSize),
});

export const nonprofitVerdictSchema = z.object({
  verdict: z.enum(["approved", "rejected"]),
  reason: z.string(),
  organizationNameInDocuments: z.string().nullable(),
});

export type NonprofitVerdict = z.infer<typeof nonprofitVerdictSchema>;

export const discardNonprofitDocumentsSchema = z.object({
  documentKeys: z.array(z.string().min(1)).min(1).max(MAX_DOCUMENTS),
});

export const applyForNonprofitDiscountSchema = z.object({
  organizationName: z.string().trim().min(1).max(200),
  website: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => normalizeWebsite(value) !== null, {
      message: "Enter the organization's https website",
    }),
  documentKeys: z.array(z.string().min(1)).min(1).max(MAX_DOCUMENTS),
});

export type ApplyForNonprofitDiscountInput = z.infer<
  typeof applyForNonprofitDiscountSchema
>;
