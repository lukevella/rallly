import { z } from "zod";

export const subscriptionCheckoutMetadataSchema = z.object({
  userId: z.string(),
});

export type SubscriptionCheckoutMetadata = z.infer<
  typeof subscriptionCheckoutMetadataSchema
>;
