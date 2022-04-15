import ModalProvider from "@/components/modal/modal-provider";
import { NextPage } from "next";
import { appWithTranslation } from "next-i18next";
import PlausibleProvider from "next-plausible";
import { AppProps } from "next/app";
import dynamic from "next/dynamic";
import Head from "next/head";
import "react-big-calendar/lib/css/react-big-calendar.css";
import toast, { Toaster } from "react-hot-toast";
import { MutationCache, QueryClient, QueryClientProvider } from "react-query";
import { useSessionStorage } from "react-use";
import "tailwindcss/tailwind.css";
import { UserNameContext } from "../components/user-name-context";
import "../style.css";

const CrispChat = dynamic(() => import("@/components/crisp-chat"), {
  ssr: false,
});

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: () => {
      toast.error(
        "Uh oh! Something went wrong. The issue has been logged and we'll fix it as soon as possible. Please try again later.",
      );
    },
  }),
});

const MyApp: NextPage<AppProps> = ({ Component, pageProps }) => {
  const sessionUserName = useSessionStorage<string>("userName", "");

  return (
    <PlausibleProvider
      domain="rallly.co"
      customDomain={process.env.PLAUSIBLE_DOMAIN}
      selfHosted={true}
      enabled={!!process.env.PLAUSIBLE_DOMAIN}
    >
      <QueryClientProvider client={queryClient}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <CrispChat />
        <Toaster />
        <ModalProvider>
          <UserNameContext.Provider value={sessionUserName}>
            <Component {...pageProps} />
          </UserNameContext.Provider>
        </ModalProvider>
      </QueryClientProvider>
    </PlausibleProvider>
  );
};

export default appWithTranslation(MyApp);
