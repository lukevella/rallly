import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { useMount } from "react-use";

import { useUser } from "@/components/user-provider";

type PostHogProviderProps = React.PropsWithChildren;

const PostHogProviderInner = (props: PostHogProviderProps) => {
  const { user } = useUser();

  useMount(() => {
    // initalize posthog with our user id
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_POSTHOG_API_KEY
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
        opt_out_capturing_by_default: false,
        capture_pageview: true,
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
};

export const PostHogProvider = (props: PostHogProviderProps) => {
  if (!process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    return <>{props.children}</>;
  }

  return <PostHogProviderInner {...props} />;
};
