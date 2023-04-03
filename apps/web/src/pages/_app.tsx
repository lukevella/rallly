import "react-big-calendar/lib/css/react-big-calendar.css";
import "tailwindcss/tailwind.css";
import "../style.css";

import { trpc, UserSession } from "@rallly/backend/next/trpc/client";
import { inject } from "@vercel/analytics";
import { NextPage } from "next";
import { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";
import { appWithTranslation } from "next-i18next";
import { DefaultSeo } from "next-seo";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import React from "react";

import Maintenance from "@/components/maintenance";

import { NextPageWithLayout } from "../types";
import { absoluteUrl } from "../utils/absolute-url";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

type PageProps = {
  user: UserSession;
};

type AppPropsWithLayout = AppProps<PageProps> & {
  Component: NextPageWithLayout<PageProps>;
};

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    opt_out_capturing_by_default: false,
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    opt_in_site_apps: true,
    loaded: (posthog) => {
      if (!process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
        posthog.opt_out_capturing();
      }
    },
  });
}

const MyApp: NextPage<AppPropsWithLayout> = ({ Component, pageProps }) => {
  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS) {
      // calling inject directly to avoid having this run for self-hosted instances
      inject({ debug: false });
    }
  }, []);

  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "1") {
    return <Maintenance />;
  }

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <PostHogProvider client={posthog}>
      <DefaultSeo
        openGraph={{
          siteName: "Rallly",
          type: "website",
          url: absoluteUrl(),
          images: [
            {
              url: absoluteUrl("/og-image-1200.png"),
              width: 1200,
              height: 630,
              alt: "Rallly | Schedule group meetings",
              type: "image/png",
            },
          ],
        }}
        facebook={{
          appId: "920386682263077",
        }}
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes"
        />
      </Head>
      <style jsx global>{`
        html {
          --font-inter: ${inter.style.fontFamily};
        }
      `}</style>
      {getLayout(<Component {...pageProps} />)}
    </PostHogProvider>
  );
};

export default trpc.withTRPC(appWithTranslation(MyApp));
