"use client";
import posthog from "posthog-js";
import type React from "react";

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
export function initPostHog({
  distinctId,
}: {
  distinctId?: string | null;
} = {}) {
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
    ...getPostHogInitOptions(),
  });

  // Merges the persisted anonymous id into the user the first time they load
  // a page signed in. posthog-js only merges from an anonymous id, so a
  // browser still carrying another account's id is switched, not merged.
  if (distinctId && posthog.get_distinct_id() !== distinctId) {
    posthog.identify(distinctId);
  }

  // null means the page knows nobody is signed in. A session that expired or
  // was revoked never ran signOut(), so the persisted id still belongs to the
  // last account; drop it rather than attribute this visitor's events to
  // them. undefined (the landing site) cannot see the session, so it leaves
  // the id alone.
  if (
    distinctId === null &&
    posthog.get_property("$user_state") === "identified"
  ) {
    posthog.reset();
  }
}

/**
 * Wrap the page content in this so the client is initialised before any
 * descendant renders or runs an effect — a sibling placed earlier in the
 * tree is not enough once Suspense boundaries stream in out of order. Pass
 * the logged-in user's id so the session is identified from its first
 * event, null where the page can see there is no logged-in user (anonymous
 * visitors and guests), and omit it where it cannot see the session at all.
 *
 * Identity is settled once per document: sign-in flows end in a full
 * navigation, never a router.refresh(), so the next load identifies, and
 * sign-out calls posthog.reset() so the browser gets a fresh anonymous id.
 */
export function PostHogInit({
  distinctId,
  children,
}: {
  distinctId?: string | null;
  children: React.ReactNode;
}) {
  initPostHog({ distinctId });
  return children;
}

export { posthog };
