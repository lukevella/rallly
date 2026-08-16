import * as z from "zod";
import { brandingLogoAssetProfile } from "./constants";

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

// The accept list is the wordmark profile's (the widest slot); the icon's
// raster-only restriction is enforced at sign time against its own profile.
export const brandingLogoUploadSchema = z.object({
  logoType: brandingLogoTypeSchema,
  fileType: z.enum(brandingLogoAssetProfile.accept),
  fileSize: z.number().int().positive().max(brandingLogoAssetProfile.maxSize),
});

export const updateBrandingLogoSchema = z.object({
  logoType: brandingLogoTypeSchema,
  imageKey: z.string().max(255),
});

export const removeBrandingLogoSchema = z.object({
  logoType: brandingLogoTypeSchema,
});
