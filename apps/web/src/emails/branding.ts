import type { EmailBranding } from "@rallly/emails";

import { getInstanceBrandingConfig } from "@/features/branding/data";
import { getInstancePolicy } from "@/features/instance-policy/data";
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
  const [instance, { spaceBrandingAllowed, spaceAttributionConfigurable }] =
    await Promise.all([getInstanceBranding(), getInstancePolicy()]);
  return {
    ...instance,
    // Where attribution is licensed at instance level it is already
    // reflected in the instance branding
    hideAttribution:
      instance.hideAttribution ||
      (spaceAttributionConfigurable && space.hideAttribution),
    ...(space.showBranding && spaceBrandingAllowed
      ? {
          primaryColor: space.primaryColor ?? instance.primaryColor,
          logoUrl: space.image
            ? resolveStorageUrl(space.image)
            : instance.logoUrl,
        }
      : {}),
  };
}
