import z from "zod";

export const billingIntervalSchema = z.enum(["month", "year"]);
export type BillingInterval = z.infer<typeof billingIntervalSchema>;

export const customerMetadataSchema = z.object({
  userId: z.string(),
});
export type CustomerMetadata = z.infer<typeof customerMetadataSchema>;
