"use client";
import type { CaptureResult } from "posthog-js";
import posthog from "posthog-js";

export { useFeatureFlagEnabled } from "posthog-js/react";

import { isGlobalPrivacyControlEnabled } from "./utils";

/**
 * Stack-frame function names that only ever appear in password-manager browser
 * extension content scripts (1Password/Dashlane-style form scanners), never in
 * our own code. Such extensions scan the page for login forms, misread our
 * invite voting form (`voting-form.tsx`) as a login form, and throw a
 * `DOMException: InvalidAccessError` from inside their own `MutationObserver`
 * callback. PostHog's exception autocapture then attributes the error to our
 * page URL, so this third-party noise ends up in error tracking.
 *
 * Matching any of these frames lets us drop the whole noise class — including
 * future variants such as other `logLogin*Detected` probes — before it is sent.
 */
const EXTENSION_NOISE_FRAME_PATTERN =
  /^(dispatchToBridge|logLogin\w*Detected)$/;

function isInjectedExtensionException(event: CaptureResult) {
  const exceptionList = event.properties?.$exception_list as
    | Array<{ stacktrace?: { frames?: Array<{ function?: string }> } }>
    | undefined;

  if (!Array.isArray(exceptionList)) {
    return false;
  }

  return exceptionList.some((exception) =>
    exception?.stacktrace?.frames?.some(
      (frame) =>
        typeof frame?.function === "string" &&
        EXTENSION_NOISE_FRAME_PATTERN.test(frame.function),
    ),
  );
}

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    debug: false,
    api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST,
    capture_pageview: false,
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
