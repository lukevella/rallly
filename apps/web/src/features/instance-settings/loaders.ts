import "server-only";

import { cache } from "react";
import { isSelfHosted } from "@/lib/constants";
import { getInstanceSettings } from "./data";
import { getUpdateStatus } from "./service";

export const loadUpdateStatus = cache(async () => {
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
 * disclosures (Impressum, privacy policy) that self-hosted instances are
 * required to make reachable, so they are not gated behind the white label
 * add-on the way the rest of the branding settings are.
 *
 * Cloud has its own static links (RAL-1563) and never reads this column.
 */
export const loadFooterLinks = cache(async () => {
  if (!isSelfHosted) {
    return [];
  }

  const { footerLinks } = await getInstanceSettings();

  return footerLinks;
});
