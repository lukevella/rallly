import type { AssetProfile } from "@/lib/storage/asset-profile";

export const instanceSettingsTag = "instance-settings";

// The wordmark slots share one profile: same prefix, same policy. The icon
// gets its own because it feeds emails, where SVG rendering is unreliable
// across clients — raster only for that slot.
export const brandingLogoAssetProfile = {
  id: "branding-logo",
  keyPrefix: "branding",
  entityIds: ["logo", "logo-dark"],
  accept: ["image/jpeg", "image/png", "image/svg+xml"],
  maxSize: 2 * 1024 * 1024,
  crop: false,
} as const satisfies AssetProfile;

export const brandingLogoIconAssetProfile = {
  id: "branding-logo-icon",
  keyPrefix: "branding",
  entityIds: ["logo-icon"],
  accept: ["image/jpeg", "image/png"],
  maxSize: 2 * 1024 * 1024,
  crop: false,
} as const satisfies AssetProfile;

// Keyed by BrandingLogoType (schema.ts); declared structurally to keep this
// module free of imports from the rest of the feature.
export const brandingLogoEntityIds = {
  logo: "logo",
  logoDark: "logo-dark",
  logoIcon: "logo-icon",
} as const;

export const brandingLogoProfiles = {
  logo: brandingLogoAssetProfile,
  logoDark: brandingLogoAssetProfile,
  logoIcon: brandingLogoIconAssetProfile,
} as const satisfies Record<keyof typeof brandingLogoEntityIds, AssetProfile>;
