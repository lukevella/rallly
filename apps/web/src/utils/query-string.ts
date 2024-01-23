"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

export function useQueryString() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const createQueryString = React.useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set(name, value);

      return pathname + "?" + params.toString();
    },
    [searchParams, pathname],
  );
  return { queryString: searchParams, createQueryString };
}
