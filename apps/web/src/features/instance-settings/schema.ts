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

export const FOOTER_LINK_MAX_COUNT = 5;
export const FOOTER_LINK_MAX_LABEL_LENGTH = 40;
export const FOOTER_LINK_MAX_HREF_LENGTH = 2048;

/**
 * Admin-typed hrefs are rendered into an anchor, so the scheme is the whole
 * security question: `javascript:` must never survive validation. Parsing with
 * `URL` rather than pattern matching avoids the usual bypasses — browsers strip
 * control characters and tolerate case and whitespace variants, so `jAvA\tscript:`
 * is one scheme to a browser and several to a regex.
 *
 * Absolute http(s) only. Relative paths were considered and rejected: Rallly
 * does not serve legal pages itself, so a path only resolves behind a reverse
 * proxy fronting another app on the same host — a narrow setup whose admin can
 * as easily paste the full URL. A leading slash is now far likelier to be a
 * mistake, and these links must also work from emails (RAL-1559), where there
 * is no base to resolve against.
 */
export function isValidFooterLinkHref(href: string) {
  const value = href.trim();

  if (!value) {
    return false;
  }

  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export const footerLinkSchema = z.object({
  label: z.string().trim().min(1).max(FOOTER_LINK_MAX_LABEL_LENGTH),
  href: z
    .string()
    .trim()
    .min(1)
    .max(FOOTER_LINK_MAX_HREF_LENGTH)
    // Message is deliberately un-localised: this schema is the server-side
    // contract and validates without a request locale. The control panel form
    // layers a translated message over the same predicate.
    .refine(isValidFooterLinkHref, { message: "Invalid URL" }),
});

export type FooterLink = z.infer<typeof footerLinkSchema>;

export const footerLinksSchema = z.object({
  footerLinks: z.array(footerLinkSchema).max(FOOTER_LINK_MAX_COUNT),
});

export type FooterLinks = z.infer<typeof footerLinksSchema>;
