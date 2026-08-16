import type { AssetProfile } from "@/lib/storage/asset-profile";

export const spaceIconAssetProfile = {
  id: "space-icon",
  keyPrefix: "spaces",
  accept: ["image/jpeg", "image/png"],
  maxSize: 2 * 1024 * 1024,
  crop: true,
} as const satisfies AssetProfile;
