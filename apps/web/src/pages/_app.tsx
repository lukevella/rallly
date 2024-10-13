import "react-big-calendar/lib/css/react-big-calendar.css";
import "tailwindcss/tailwind.css";
import "../style.css";

import { TooltipProvider } from "@rallly/ui/tooltip";
import { LazyMotion, domMax } from "framer-motion";
import type { NextPage } from "next";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";
import React from "react";

import { I18nProvider } from "@/app/i18n/client";
import Maintenance from "@/components/maintenance";
import { UserProvider } from "@/components/user-provider";
import { ConnectedDayjsProvider } from "@/utils/dayjs";
import { trpc } from "@/utils/trpc/client";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const MyApp: NextPage<AppProps> = ({ Component, pageProps }) => {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "1") {
    return <Maintenance />;
  }

  const children = <Component {...pageProps} />;

  return (
    <SessionProvider>
      <LazyMotion features={domMax}>
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
        <I18nProvider>
          <TooltipProvider delayDuration={200}>
            <UserProvider>
              <ConnectedDayjsProvider>{children}</ConnectedDayjsProvider>
            </UserProvider>
          </TooltipProvider>
        </I18nProvider>
      </LazyMotion>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
