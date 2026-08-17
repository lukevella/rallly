"use client";
import posthog from "posthog-js";

export {
  useFeatureFlagEnabled,
  useFeatureFlagVariantKey,
} from "posthog-js/react";

import {
  isGlobalPrivacyControlEnabled,
  isInjectedExtensionException,
} from "./utils";

// Edge middleware can pre-assign feature flags (one `ph_ff_<flag>` cookie per
// flag, plus `ph_did` for the distinct id it evaluated them against) so the
// first client render agrees with the server-rendered variant. The distinct id
// is only adopted while PostHog has no identity of its own; stored identities
// take precedence.
function getBootstrapData() {
  const featureFlags: Record<string, string> = {};
  let distinctID: string | undefined;
  let hasOwnIdentity = false;
  for (const cookie of document.cookie.split("; ")) {
    const separatorIndex = cookie.indexOf("=");
    const name = cookie.slice(0, separatorIndex);
    const value = cookie.slice(separatorIndex + 1);
    if (name.startsWith("ph_ff_")) {
      featureFlags[name.slice("ph_ff_".length)] = value;
    } else if (name === "ph_did") {
      distinctID = value;
    } else if (name.startsWith("ph_") && name.endsWith("_posthog")) {
      hasOwnIdentity = true;
    }
  }
  if (Object.keys(featureFlags).length === 0 && !distinctID) {
    return undefined;
  }
  return {
    distinctID: hasOwnIdentity ? undefined : distinctID,
    featureFlags,
  };
}

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    bootstrap: getBootstrapData(),
    debug: false,
    api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST,
    capture_pageview: "history_change",
    capture_pageleave: true,
    enable_heatmaps: false,
    persistence: "cookie",
    autocapture: false,
    opt_out_capturing_by_default: isGlobalPrivacyControlEnabled(),
    cross_subdomain_cookie: true,
    capture_performance: {
      web_vitals: false,
    },
    before_send: (event) => {
      if (
        event?.event === "$exception" &&
        isInjectedExtensionException(event)
      ) {
        return null;
      }
      return event;
    },
  });
}

export { posthog };
