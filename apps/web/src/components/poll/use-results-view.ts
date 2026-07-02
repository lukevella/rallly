"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export type ResultsView = "grid" | "calendar";

/**
 * Reads/writes the results view mode from the `view` query param so the choice
 * is shareable and survives reloads. Defaults to the grid, which omits the param.
 */
export function useResultsView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const view: ResultsView =
    searchParams?.get("view") === "calendar" ? "calendar" : "grid";

  const setView = React.useCallback(
    (next: ResultsView) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (next === "grid") {
        params.delete("view");
      } else {
        params.set("view", next);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return { view, setView };
}
