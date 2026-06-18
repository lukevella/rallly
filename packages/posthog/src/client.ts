"use client";
import posthog from "posthog-js";

export { useFeatureFlagEnabled } from "posthog-js/react";

import { isGlobalPrivacyControlEnabled } from "./utils";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    debug: false,
    api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: false,
    disable_session_recording: true,
    enable_heatmaps: false,
    persistence: "cookie",
    autocapture: false,
    opt_out_capturing_by_default: isGlobalPrivacyControlEnabled(),
    cross_subdomain_cookie: true,
    capture_performance: {
      web_vitals: false,
    },
  });
}

export { posthog };
