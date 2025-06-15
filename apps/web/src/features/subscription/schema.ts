import { z } from "zod";

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
