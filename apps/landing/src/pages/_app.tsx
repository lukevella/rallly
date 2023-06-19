import "react-big-calendar/lib/css/react-big-calendar.css";
import "tailwindcss/tailwind.css";
import "../style.css";

import { trpc, UserSession } from "@rallly/backend/next/trpc/client";
import { absoluteUrl } from "@rallly/utils";
import { inject } from "@vercel/analytics";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { domMax, LazyMotion } from "framer-motion";
import { NextPage } from "next";
import { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";
import { appWithTranslation } from "next-i18next";
import { DefaultSeo } from "next-seo";
import React from "react";

import * as nextI18nNextConfig from "../../next-i18next.config.js";
import { NextPageWithLayout } from "../types";

dayjs.extend(localizedFormat);

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

type PageProps = {
  user?: UserSession;
};

type AppPropsWithLayout = AppProps<PageProps> & {
  Component: NextPageWithLayout<PageProps>;
};

const MyApp: NextPage<AppPropsWithLayout> = ({ Component, pageProps }) => {
  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS) {
      // calling inject directly to avoid having this run for self-hosted instances
      inject({ debug: false });
    }
  }, []);

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
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
      <style jsx global>{`
        html {
          --font-inter: ${inter.style.fontFamily};
        }
      `}</style>
      {getLayout(<Component {...pageProps} />)}
    </LazyMotion>
  );
};

export default trpc.withTRPC(appWithTranslation(MyApp, nextI18nNextConfig));
