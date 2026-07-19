import * as z from "zod";

export const billingIntervalSchema = z.enum(["month", "year"]);
export type BillingInterval = z.infer<typeof billingIntervalSchema>;

export const subscriptionStatusSchema = z.enum([
  "incomplete",
  "incomplete_expired",
  "active",
  "paused",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const customerMetadataSchema = z.object({
  userId: z.string(),
});
export type CustomerMetadata = z.infer<typeof customerMetadataSchema>;

export const subscriptionCheckoutMetadataSchema = z.object({
  userId: z.string(),
  spaceId: z.string().optional(),
});

export type SubscriptionCheckoutMetadata = z.infer<
  typeof subscriptionCheckoutMetadataSchema
>;

export const subscriptionMetadataSchema = z.object({
  userId: z.string(),
  spaceId: z.string(),
});

export type SubscriptionMetadata = z.infer<typeof subscriptionMetadataSchema>;
