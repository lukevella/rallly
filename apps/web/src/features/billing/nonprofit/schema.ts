import * as z from "zod";
import { nonprofitDocumentAssetProfile } from "@/features/billing/nonprofit/constants";

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
