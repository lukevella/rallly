"use client";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

import { usePostHog } from "./client";

export default function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const previousUrl = React.useRef<string | null>(null);
  React.useEffect(() => {
    // Track pageviews
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      if (previousUrl.current !== url) {
        posthog.capture("$pageview", {
          $current_url: url,
        });
        previousUrl.current = url;
      }
    }
  }, [pathname, searchParams, posthog]);

  return null;
}
