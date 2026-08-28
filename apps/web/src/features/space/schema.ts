import * as z from "zod";
import { industries, spaceIconAssetProfile } from "@/features/space/constants";

export const memberRoleSchema = z.enum(["member", "admin"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const spaceTierSchema = z.enum(["hobby", "pro"]);
export type SpaceTier = z.infer<typeof spaceTierSchema>;

// "space": members see everything created in the space (Together).
// "owner": members see only what they create themselves; admins always see
// everything (Independently).
export const spaceContentVisibilitySchema = z.enum(["space", "owner"]);
export type SpaceContentVisibility = z.infer<
  typeof spaceContentVisibilitySchema
>;

// The taxonomy is validated here rather than in the database so a v2 list
// costs a deploy instead of an enum migration.
export const industrySchema = z.enum(industries);

export const createSpaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateSpaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
    .nullable()
    .optional(),
});

export const updateSpaceShowBrandingSchema = z.object({
  showBranding: z.boolean(),
});

export const updateSpaceHideAttributionSchema = z.object({
  hideAttribution: z.boolean(),
});

export const updateSpaceContentVisibilitySchema = z.object({
  contentVisibility: spaceContentVisibilitySchema,
});

export const spaceImageUploadSchema = z.object({
  fileType: z.enum(spaceIconAssetProfile.accept),
  fileSize: z.number().int().positive().max(spaceIconAssetProfile.maxSize),
});

export const updateSpaceImageSchema = z.object({
  imageKey: z.string().max(255),
});
