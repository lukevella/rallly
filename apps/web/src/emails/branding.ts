import type { EmailBranding } from "@rallly/emails";

import { getInstanceBrandingConfig } from "@/features/branding/data";
import { isSelfHosted } from "@/lib/constants";
import { resolveStorageUrl } from "@/lib/storage/resolve-storage-url";

/**
 * Branding for emails that represent the instance/product (auth, billing,
 * account, moderation, etc.).
 */
export async function getInstanceBranding(): Promise<EmailBranding> {
  const branding = await getInstanceBrandingConfig();
  return {
    primaryColor: branding.primaryColor.light,
    logoUrl: branding.logoIcon,
    appName: branding.appName,
    hideAttribution: branding.hideAttribution,
  };
}

/**
 * Branding for emails sent on behalf of a space — instance branding with the
 * space's logo/color applied when the space has custom branding enabled.
 */
export async function getSpaceBranding(space: {
  showBranding: boolean;
  hideAttribution: boolean;
  primaryColor: string | null;
  image: string | null;
}): Promise<EmailBranding> {
  const instance = await getInstanceBranding();
  return {
    ...instance,
    // Space-level attribution removal is cloud-only; self-hosted attribution
    // is licensed at instance level and already reflected in the instance
    // branding.
    hideAttribution:
      instance.hideAttribution || (!isSelfHosted && space.hideAttribution),
    ...(space.showBranding
      ? {
          primaryColor: space.primaryColor ?? instance.primaryColor,
          logoUrl: space.image
            ? resolveStorageUrl(space.image)
            : instance.logoUrl,
        }
      : {}),
  };
}
