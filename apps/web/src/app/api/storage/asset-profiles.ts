import {
  brandingLogoAssetProfile,
  brandingLogoIconAssetProfile,
} from "@/features/instance-settings/constants";
import { spaceIconAssetProfile } from "@/features/space/constants";
import { avatarAssetProfile } from "@/features/user/constants";
import type { AssetProfile } from "@/lib/storage/asset-profile";

// Profiles are feature-owned; the storage route needs a key-to-profile
// lookup across all of them, and lib cannot import features — so the
// aggregation lives here, at the app layer next to its only consumer.
export const assetProfiles: readonly AssetProfile[] = [
  avatarAssetProfile,
  spaceIconAssetProfile,
  brandingLogoAssetProfile,
  brandingLogoIconAssetProfile,
];
