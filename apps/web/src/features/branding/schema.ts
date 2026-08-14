import * as z from "zod";

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color");

export const brandingSettingsSchema = z.object({
  appName: z.string().min(1).max(100).nullish(),
  primaryColor: hexColorSchema.nullish(),
  primaryColorDark: hexColorSchema.nullish(),
  logoUrl: z.string().nullish(),
  logoUrlDark: z.string().nullish(),
  logoIconUrl: z.string().nullish(),
  hideAttribution: z.boolean().optional(),
});

export type BrandingSettings = z.infer<typeof brandingSettingsSchema>;

export const brandingImageTypeSchema = z.enum([
  "logo",
  "logo-dark",
  "logo-icon",
]);

export type BrandingImageType = z.infer<typeof brandingImageTypeSchema>;
