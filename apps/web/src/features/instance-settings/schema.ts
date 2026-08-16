import * as z from "zod";

export const instanceSettingsSchema = z.object({
  disableUserRegistration: z.boolean(),
});

export type InstanceSettings = z.infer<typeof instanceSettingsSchema>;

export const brandingSettingsSchema = z.object({
  appName: z.string().trim().min(1).max(100),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
  primaryColorDark: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
  hideAttribution: z.boolean(),
});

export type BrandingSettings = z.infer<typeof brandingSettingsSchema>;

export const brandingLogoTypeSchema = z.enum(["logo", "logoDark", "logoIcon"]);

export type BrandingLogoType = z.infer<typeof brandingLogoTypeSchema>;

export const brandingLogoUploadSchema = z.object({
  logoType: brandingLogoTypeSchema,
  fileType: z.enum(["image/jpeg", "image/png"]),
  fileSize: z.number(),
});

export const updateBrandingLogoSchema = z.object({
  logoType: brandingLogoTypeSchema,
  imageKey: z.string().max(255),
});

export const removeBrandingLogoSchema = z.object({
  logoType: brandingLogoTypeSchema,
});
