import "server-only";

import { cache } from "react";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { getInstanceSettings } from "./data";
import { getUpdateStatus } from "./service";

export const loadUpdateStatus = cache(async () => {
  if (!isFeatureEnabled("updateCheck")) {
    return null;
  }

  const { instanceId } = await getInstanceSettings();

  if (!instanceId) {
    return null;
  }

  return getUpdateStatus({ instanceId });
});

/**
 * Footer links for the login and invite page footers.
 *
 * Deliberately not routed through the branding config: these carry legal
 * disclosures (Impressum, privacy policy) that instances are required to make
 * reachable, so they are not gated behind the white label add-on the way the
 * rest of the branding settings are.
 *
 * Cloud links Rallly's own policies, labelled per locale. Self-hosted serves
 * whatever the operator configured, labels as typed.
 */
export const loadFooterLinks = cache(async () => {
  if (!isFeatureEnabled("customFooterLinks")) {
    const { t } = await getTranslation();

    return [
      {
        label: t("privacyPolicy", { defaultValue: "Privacy policy" }),
        href: "https://rallly.co/privacy-policy",
      },
      {
        label: t("termsOfUse", { defaultValue: "Terms of use" }),
        href: "https://rallly.co/terms-of-use",
      },
      {
        label: t("cookiePolicy", { defaultValue: "Cookie policy" }),
        href: "https://rallly.co/cookie-policy",
      },
    ];
  }

  const { footerLinks } = await getInstanceSettings();

  return footerLinks;
});

/**
 * Footer links for the invite and admin poll pages. Cloud's policy links are
 * left off these pages for now, since the comments pill covers them on
 * mobile; self-hosted operators' links still show.
 */
export const loadPollFooterLinks = cache(async () => {
  if (!isFeatureEnabled("customFooterLinks")) {
    return [];
  }

  return loadFooterLinks();
});
