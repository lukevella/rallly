"use client";
import posthog from "posthog-js";
import type React from "react";

export { useFeatureFlagEnabled } from "posthog-js/react";

import { getPostHogInitOptions } from "./client-config";
import {
  isAbortError,
  isInjectedExtensionException,
  isResizeObserverLoopError,
  isUnsymbolicatedMinifiedException,
} from "./utils";

let initialized = false;

/**
 * Initialise the browser client once per page load. Idempotent and safe to
 * call during render, which is deliberate: it has to run before any child
 * effect captures an event or registers a group, and effects run child-first.
 * No-op on the server and when no key is configured.
 */
export function initPostHog({ distinctId }: { distinctId?: string } = {}) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
  if (initialized || typeof window === "undefined" || !apiKey) {
    return;
  }
  initialized = true;

  posthog.init(apiKey, {
    debug: false,
    api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST,
    capture_pageview: "history_change",
    capture_pageleave: true,
    enable_heatmaps: false,
    autocapture: false,
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
    ...getPostHogInitOptions({ distinctId }),
  });
}

/**
 * Wrap the page content in this so the client is initialised before any
 * descendant renders or runs an effect — a sibling placed earlier in the
 * tree is not enough once Suspense boundaries stream in out of order. Pass
 * the logged-in user's id so the session is identified from its first
 * event; omit it for anonymous visitors and guests.
 *
 * Identity is fixed for the life of the document: a cookieless instance
 * cannot identify later, and a bootstrapped one must not be re-pointed at
 * another user. Sign-in flows therefore end in a full navigation, never a
 * router.refresh(), and sign-out calls posthog.reset() so events after it
 * are anonymous until the next document load.
 */
export function PostHogInit({
  distinctId,
  children,
}: {
  distinctId?: string;
  children: React.ReactNode;
}) {
  initPostHog({ distinctId });
  return children;
}

export { posthog };
