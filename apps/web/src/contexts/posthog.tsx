"use client";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as Provider, usePostHog } from "posthog-js/react";
import React from "react";
import { useMount } from "react-use";

import { useTranslation } from "@/app/i18n/client";
import { useUser } from "@/components/user-provider";
import { env } from "@/env";

type PostHogProviderProps = React.PropsWithChildren;

if (typeof window !== "undefined" && env.NEXT_PUBLIC_POSTHOG_API_KEY) {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    debug: true,
    api_host: env.NEXT_PUBLIC_POSTHOG_API_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    enable_heatmaps: false,
    persistence: "memory",
    autocapture: false,
    opt_out_capturing_by_default: false,
  });
}

function usePostHogPageView() {
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
}

export function PostHogProvider(props: PostHogProviderProps) {
  const { user } = useUser();
  const { i18n } = useTranslation();

  usePostHogPageView();

  useMount(() => {
    if (user.email) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        tier: user.tier,
        timeZone: user.timeZone,
        locale: i18n.language,
      });
    }
  });

  return <Provider client={posthog}>{props.children}</Provider>;
}
