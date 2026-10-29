"use client";

import { useRouter } from "next/navigation";
import React from "react";

/**
 * Re-renders the server components of the current route when the tab becomes
 * visible again, so server data that depends on the clock (an event that has
 * ended since) doesn't go stale while the page stays open.
 */
export function RefreshOnFocus() {
  const router = useRouter();

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
