import * as z from "zod";

const inPersonLocationSchema = z.object({
  type: z.literal("in_person"),
  address: z.string().min(1),
  placeId: z.string().optional(),
});

const customLinkLocationSchema = z.object({
  type: z.literal("custom_link"),
  url: z.url(),
  text: z.string().optional(),
});

export const locationSchema = z.discriminatedUnion("type", [
  inPersonLocationSchema,
  customLinkLocationSchema,
]);

export type Location = z.infer<typeof locationSchema>;
export type LocationType = Location["type"];
