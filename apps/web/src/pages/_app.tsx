import "react-big-calendar/lib/css/react-big-calendar.css";
import "tailwindcss/tailwind.css";
import "../style.css";

import { TooltipProvider } from "@rallly/ui/tooltip";
import { domMax, LazyMotion } from "framer-motion";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";
import { SessionProvider, signIn, useSession } from "next-auth/react";
import React from "react";

import Maintenance from "@/components/maintenance";
import { UserProvider } from "@/components/user-provider";
import { I18nProvider } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { ConnectedDayjsProvider } from "@/utils/dayjs";

import type { NextPageWithLayout } from "../types";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const Auth = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  const isAuthenticated = !!session.data?.user.email;

  React.useEffect(() => {
    if (!isAuthenticated) {
      signIn();
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
};

const MyApp: NextPage<AppPropsWithLayout> = ({ Component, pageProps }) => {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "1") {
    return <Maintenance />;
  }

  const getLayout = Component.getLayout ?? ((page) => page);
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
              <ConnectedDayjsProvider>
                {Component.isAuthRequired ? (
                  <Auth>{getLayout(children)}</Auth>
                ) : (
                  getLayout(children)
                )}
              </ConnectedDayjsProvider>
            </UserProvider>
          </TooltipProvider>
        </I18nProvider>
      </LazyMotion>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
