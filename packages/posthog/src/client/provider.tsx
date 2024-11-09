"use client";
import Cookies from "js-cookie";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import React from "react";

import { POSTHOG_BOOTSTAP_DATA_COOKIE_NAME } from "../constants";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
  let bootstrapData = {};
  try {
    const cookieData = Cookies.get(POSTHOG_BOOTSTAP_DATA_COOKIE_NAME);
    if (cookieData) {
      bootstrapData = JSON.parse(cookieData);
    }
  } catch (error) {
    console.warn("Failed to parse PostHog bootstrap data:", error);
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    debug: false,
    api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    enable_heatmaps: false,
    persistence: "memory",
    bootstrap: bootstrapData,
    autocapture: false,
    opt_out_capturing_by_default: false,
  });
}

export function PostHogProvider(props: { children?: React.ReactNode }) {
  return <Provider client={posthog}>{props.children}</Provider>;
}
