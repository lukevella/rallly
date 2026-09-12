import * as z from "zod";

export const nonprofitVerdictSchema = z.object({
  verdict: z.enum(["approved", "rejected"]),
  reason: z.string(),
  organizationNameInDocuments: z.string().nullable(),
});

export type NonprofitVerdict = z.infer<typeof nonprofitVerdictSchema>;
