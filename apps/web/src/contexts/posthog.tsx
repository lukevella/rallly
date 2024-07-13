"use client";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { useMount } from "react-use";

import { useUser } from "@/components/user-provider";

type PostHogProviderProps = React.PropsWithChildren;

export function PostHogProvider(props: PostHogProviderProps) {
  const { user } = useUser();

  useMount(() => {
    // initalize posthog with our user id
    if (process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
        opt_out_capturing_by_default: false,
        capture_pageview: true,
        // we use session recordings to offer support and
        // improve the product for our pro users
        disable_session_recording: true,
        persistence: "memory",
        capture_pageleave: false,
        autocapture: false,
        opt_in_site_apps: true,
        bootstrap: {
          distinctID: user.id,
        },
      });
    }
  });

  return <Provider client={posthog}>{props.children}</Provider>;
}
