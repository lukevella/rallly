"use client";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import React from "react";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    debug: false,
    api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    enable_heatmaps: false,
    persistence: "memory",
    autocapture: false,
    opt_out_capturing_by_default: false,
  });
}

export function PostHogProvider(props: { children?: React.ReactNode }) {
  return <Provider client={posthog}>{props.children}</Provider>;
}
