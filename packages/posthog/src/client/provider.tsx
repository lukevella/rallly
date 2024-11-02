"use client";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import React from "react";

export function PostHogProvider(props: {
  children?: React.ReactNode;
  distinctId?: string;
}) {
  React.useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
      // Don't initialize posthog if the api key is not set
      return;
    }
    // Initialize posthog with distinct id on mount
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      debug: false,
      api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: true,
      enable_heatmaps: false,
      persistence: "memory",
      autocapture: false,
      bootstrap: {
        distinctID: props.distinctId,
      },
      opt_out_capturing_by_default: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Provider client={posthog}>{props.children}</Provider>;
}
