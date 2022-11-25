import "react-big-calendar/lib/css/react-big-calendar.css";
import "tailwindcss/tailwind.css";
import "~/style.css";

import { withTRPC } from "@trpc/next";
import { NextPage } from "next";
import { AppProps } from "next/app";
import dynamic from "next/dynamic";
import Head from "next/head";
import { appWithTranslation } from "next-i18next";
import PlausibleProvider from "next-plausible";
import { DefaultSeo } from "next-seo";
import toast, { Toaster } from "react-hot-toast";
import { MutationCache } from "react-query";
import superjson from "superjson";

import Maintenance from "@/components/maintenance";

import { absoluteUrl } from "../utils/absolute-url";
import { AppRouter } from "./api/trpc/[trpc]";

const CrispChat = dynamic(() => import("@/components/crisp-chat"), {
  ssr: false,
});

const MyApp: NextPage<AppProps> = ({ Component, pageProps }) => {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "1") {
    return <Maintenance />;
  }
  return (
    <PlausibleProvider
      domain="rallly.co"
      customDomain={process.env.PLAUSIBLE_DOMAIN}
      trackOutboundLinks={true}
      selfHosted={true}
      enabled={!!process.env.PLAUSIBLE_DOMAIN}
    >
      <DefaultSeo
        canonical={absoluteUrl()}
        openGraph={{
          siteName: "Rallly",
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
      />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <CrispChat />
      <Toaster />
      <Component {...pageProps} />
    </PlausibleProvider>
  );
};

export default withTRPC<AppRouter>({
  config() {
    const url = "/api/trpc";

    return {
      transformer: superjson,
      url,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      queryClientConfig: {
        mutationCache: new MutationCache({
          onError: () => {
            toast.error(
              "Uh oh! Something went wrong. The issue has been logged and we'll fix it as soon as possible. Please try again later.",
            );
          },
        }),
      },
    };
  },
  ssr: false, // doesn't play well with how we're fetching legacy endpoints. consider switching it on when we don't need to get legacy polls
})(appWithTranslation(MyApp));
