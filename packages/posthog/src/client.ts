"use client";
import posthog from "posthog-js";
import React from "react";

export { useFeatureFlagEnabled } from "posthog-js/react";

import {
  isAbortError,
  isGlobalPrivacyControlEnabled,
  isInjectedExtensionException,
  isResizeObserverLoopError,
  isUnsymbolicatedMinifiedException,
} from "./utils";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    debug: false,
    api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST,
    capture_pageview: "history_change",
    capture_pageleave: true,
    enable_heatmaps: false,
    persistence: "cookie",
    autocapture: false,
    // ePrivacy consent model: until the user accepts the cookie banner —
    // and permanently if they reject it — nothing is stored on the device
    // (no ph_* cookie) and events are captured cookielessly: the client
    // sends a sentinel distinct_id and the server substitutes a
    // daily-rotating hash of IP+UA. Requires "Cookieless server hash mode"
    // in PostHog project settings; without it these events are dropped at
    // ingestion. opt_in_capturing() switches to full cookie persistence.
    cookieless_mode: "on_reject",
    opt_out_capturing_by_default: true,
    opt_out_persistence_by_default: true,
    // The consent decision rides the apex-domain cookie like the identity
    // cookie, so a choice made on the landing site carries to the app.
    opt_out_capturing_persistence_type: "cookie",
    cross_subdomain_cookie: true,
    capture_performance: {
      web_vitals: false,
    },
    before_send: (event) => {
      if (
        event?.event === "$exception" &&
        (isInjectedExtensionException(event) ||
          isAbortError(event) ||
          isResizeObserverLoopError(event) ||
          isUnsymbolicatedMinifiedException(event))
      ) {
        return null;
      }
      return event;
    },
  });
}

export { posthog };

/**
 * Consent state for the cookie banner, backed by PostHog's own consent
 * store (a cross-subdomain first-party cookie — strictly necessary, so
 * exempt from consent itself).
 *
 * `status` is null until mounted (the decision is client-side state, so
 * banners must render nothing on the server), and stays null when there is
 * no PostHog key or the browser sends Global Privacy Control — GPC is an
 * opt-out signal, so showing the banner would ask the user to override a
 * choice they already expressed; capture stays cookieless instead.
 */
export function useCookieConsent() {
  const [status, setStatus] = React.useState<
    "pending" | "granted" | "denied" | null
  >(null);

  React.useEffect(() => {
    if (!posthog.__loaded || isGlobalPrivacyControlEnabled()) {
      return;
    }
    setStatus(posthog.get_explicit_consent_status());
  }, []);

  const accept = React.useCallback(() => {
    posthog.opt_in_capturing();
    setStatus("granted");
  }, []);

  const reject = React.useCallback(() => {
    posthog.opt_out_capturing();
    setStatus("denied");
  }, []);

  return { status, accept, reject };
}
