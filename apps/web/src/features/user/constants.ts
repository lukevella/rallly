import type { AssetProfile } from "@/lib/storage/asset-profile";

export const avatarAssetProfile = {
  id: "avatar",
  keyPrefix: "avatars",
  accept: ["image/jpeg", "image/png"],
  maxSize: 2 * 1024 * 1024,
} as const satisfies AssetProfile;
