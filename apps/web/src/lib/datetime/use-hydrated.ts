"use client";

import React from "react";

const emptySubscribe = () => () => {};

/**
 * False on the server and during the hydration render, true afterwards.
 * Intl output isn't stable across engines (ICU/CLDR/tzdata versions differ
 * between Node and each visitor's browser), so formatted dates and times
 * must not be rendered until after hydration.
 */
export function useHydrated() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
