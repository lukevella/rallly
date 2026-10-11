"use client";

import { create } from "zustand";
import type { OpenPollUsage } from "./types";

export type OpenPollLimitSource = "create" | "reopen";

type OpenPollLimitStore = {
  open: { source: OpenPollLimitSource; usage: OpenPollUsage } | null;
  show: (source: OpenPollLimitSource, usage: OpenPollUsage) => void;
  hide: () => void;
};

export const useOpenPollLimitStore = create<OpenPollLimitStore>((set) => ({
  open: null,
  show: (source, usage) => set({ open: { source, usage } }),
  hide: () => set({ open: null }),
}));

/**
 * Opens the app-wide limit dialog with the usage it shows: from a refusal,
 * or from the page's loader when the organizer is already at the limit.
 */
export const showOpenPollLimit = (
  source: OpenPollLimitSource,
  usage: OpenPollUsage,
) => useOpenPollLimitStore.getState().show(source, usage);

/** The refusal a create, reopen or duplicate returned, or null. */
export function getOpenPollLimitRefusal<E extends { code: string }>(result: {
  ok: boolean;
  error?: E;
}) {
  return !result.ok && result.error?.code === "OPEN_POLL_LIMIT_REACHED"
    ? (result.error as Extract<E, { code: "OPEN_POLL_LIMIT_REACHED" }>)
    : null;
}
