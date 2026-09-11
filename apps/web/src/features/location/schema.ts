import * as z from "zod";

const customLocationSchema = z.object({
  provider: z.literal("custom"),
  address: z.string().min(1),
});

// `provider` is the forward-compatible discriminator. Future providers
// (e.g. google_places, what3words) can be added without a schema change
// — parsers and pickers branch on `provider`.
export const locationSchema = z.discriminatedUnion("provider", [
  customLocationSchema,
]);

export type Location = z.infer<typeof locationSchema>;
