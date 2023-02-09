import "react-big-calendar/lib/css/react-big-calendar.css";
import "tailwindcss/tailwind.css";
import "~/style.css";

import { Inter, Noto_Sans_Mono } from "@next/font/google";
import { inject } from "@vercel/analytics";
import { NextPage } from "next";
import { AppProps } from "next/app";
import Head from "next/head";
import { appWithTranslation } from "next-i18next";
import { DefaultSeo } from "next-seo";
import React from "react";
import { Toaster } from "react-hot-toast";

import Maintenance from "@/components/maintenance";

import { useCrispChat } from "../components/crisp-chat";
import ModalProvider from "../components/modal/modal-provider";
import { NextPageWithLayout } from "../types";
import { absoluteUrl } from "../utils/absolute-url";
import { UserSession } from "../utils/auth";
import { trpcNext } from "../utils/trpc";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const noto = Noto_Sans_Mono({
  subsets: ["latin"],
  display: "swap",
});

type PageProps = {
  user: UserSession;
};

type AppPropsWithLayout = AppProps<PageProps> & {
  Component: NextPageWithLayout<PageProps>;
};

const MyApp: NextPage<AppPropsWithLayout> = ({ Component, pageProps }) => {
  useCrispChat();

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
    <>
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
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <Toaster />
      <style jsx global>{`
        html {
          --font-inter: ${inter.style.fontFamily};
          --font-noto: ${noto.style.fontFamily};
        }
      `}</style>
      <ModalProvider>{getLayout(<Component {...pageProps} />)}</ModalProvider>
    </>
  );
};

export default trpcNext.withTRPC(appWithTranslation(MyApp));
