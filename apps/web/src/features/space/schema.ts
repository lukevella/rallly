import * as z from "zod";

export const memberRoleSchema = z.enum(["member", "admin"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const spaceTierSchema = z.enum(["hobby", "pro"]);
export type SpaceTier = z.infer<typeof spaceTierSchema>;

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

export const spaceImageUploadSchema = z.object({
  fileType: z.enum(["image/jpeg", "image/png"]),
  fileSize: z.number(),
});

export const updateSpaceImageSchema = z.object({
  imageKey: z.string().max(255),
});
