import "react-big-calendar/lib/css/react-big-calendar.css";
import "tailwindcss/tailwind.css";
import "../style.css";

import { trpc } from "@rallly/backend/next/trpc/client";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { domMax, LazyMotion } from "framer-motion";
import { NextPage } from "next";
import { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { appWithTranslation } from "next-i18next";
import { DefaultSeo } from "next-seo";
import React from "react";

import Maintenance from "@/components/maintenance";

import * as nextI18nNextConfig from "../../next-i18next.config.js";
import { NextPageWithLayout } from "../types";
import { absoluteUrl } from "../utils/absolute-url";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp: NextPage<AppPropsWithLayout> = ({ Component, pageProps }) => {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "1") {
    return <Maintenance />;
  }

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <SessionProvider>
      <LazyMotion features={domMax}>
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
        {process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID ? (
          <Script
            src="https://cdn.paddle.com/paddle/paddle.js"
            onLoad={() => {
              if (process.env.NEXT_PUBLIC_PADDLE_SANDBOX === "true") {
                window.Paddle.Environment.set("sandbox");
              }
              window.Paddle.Setup({
                vendor: Number(process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID),
              });
            }}
          />
        ) : null}
        <style jsx global>{`
          html {
            --font-inter: ${inter.style.fontFamily};
          }
        `}</style>
        <TooltipProvider delayDuration={200}>
          {getLayout(<Component {...pageProps} />)}
        </TooltipProvider>
      </LazyMotion>
    </SessionProvider>
  );
};

export default trpc.withTRPC(appWithTranslation(MyApp, nextI18nNextConfig));
