"use client";

import { posthog } from "@rallly/posthog/client";
import { create } from "zustand";
import type { OpenPollUsage } from "./types";

export type OpenPollLimitSource = "create" | "reopen" | "duplicate";

type OpenPollLimitStore = {
  isOpen: boolean;
  /** Kept after closing, so the dialog still has content while it animates out */
  content: {
    source: OpenPollLimitSource;
    usage: OpenPollUsage;
    /** The page it was opened on: only that page shows it */
    pathname: string;
  } | null;
  show: (source: OpenPollLimitSource, usage: OpenPollUsage) => void;
  hide: () => void;
};

export const useOpenPollLimitStore = create<OpenPollLimitStore>((set) => ({
  isOpen: false,
  content: null,
  show: (source, usage) => {
    posthog?.capture("poll_limit:wall_view", {
      tier: usage.tier,
      open_count: usage.openCount,
      limit: usage.limit,
      source,
    });
    set({
      isOpen: true,
      content: { source, usage, pathname: window.location.pathname },
    });
  },
  hide: () => set({ isOpen: false }),
}));

/**
 * Opens the app-wide limit dialog with the usage it shows: from a refusal,
 * or from the page's loader when the organizer is already at the limit.
 */
export const showOpenPollLimit = (
  source: OpenPollLimitSource,
  usage: OpenPollUsage,
) => useOpenPollLimitStore.getState().show(source, usage);

/** Closes the dialog if it was opened for this reason. */
export const hideOpenPollLimit = (source: OpenPollLimitSource) => {
  const { isOpen, content, hide } = useOpenPollLimitStore.getState();
  if (isOpen && content?.source === source) {
    hide();
  }
};

/** The refusal a create, reopen or duplicate returned, or null. */
export function getOpenPollLimitRefusal<E extends { code: string }>(result: {
  ok: boolean;
  error?: E;
}) {
  return !result.ok && result.error?.code === "OPEN_POLL_LIMIT_REACHED"
    ? (result.error as Extract<E, { code: "OPEN_POLL_LIMIT_REACHED" }>)
    : null;
}
