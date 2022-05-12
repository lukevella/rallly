import "react-big-calendar/lib/css/react-big-calendar.css";
import "tailwindcss/tailwind.css";
import "../style.css";

import axios from "axios";
import { NextPage } from "next";
import { AppProps } from "next/app";
import dynamic from "next/dynamic";
import Head from "next/head";
import { appWithTranslation } from "next-i18next";
import PlausibleProvider from "next-plausible";
import toast, { Toaster } from "react-hot-toast";
import { MutationCache, QueryClient, QueryClientProvider } from "react-query";

import Maintenance from "@/components/maintenance";
import ModalProvider from "@/components/modal/modal-provider";
import PreferencesProvider from "@/components/preferences/preferences-provider";

const CrispChat = dynamic(() => import("@/components/crisp-chat"), {
  ssr: false,
});

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 500) {
        toast.error(
          "Uh oh! Something went wrong. The issue has been logged and we'll fix it as soon as possible. Please try again later.",
        );
      }
    },
  }),
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
      <PreferencesProvider>
        <QueryClientProvider client={queryClient}>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
          </Head>
          <CrispChat />
          <Toaster />
          <ModalProvider>
            <Component {...pageProps} />
          </ModalProvider>
        </QueryClientProvider>
      </PreferencesProvider>
    </PlausibleProvider>
  );
};

export default appWithTranslation(MyApp);
