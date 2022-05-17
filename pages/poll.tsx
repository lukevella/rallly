import { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";

import FullPageLoader from "@/components/full-page-loader";
import { PollContextProvider } from "@/components/poll-context";
import { SessionProps, withSession } from "@/components/session";

import { withSessionSsr } from "../utils/auth";
import { trpc } from "../utils/trpc";
import Custom404 from "./404";

const PollPage = dynamic(() => import("@/components/poll"), { ssr: false });

const PollPageLoader: NextPage<SessionProps> = () => {
  const { query } = useRouter();
  const { t } = useTranslation("app");
  const urlId = query.urlId as string;

  const [didError, setDidError] = React.useState(false);

  const { data: poll } = trpc.useQuery(["polls.get", { urlId }], {
    onError: () => {
      setDidError(true);
    },
    retry: false,
  });

  if (poll) {
    return (
      <PollContextProvider value={poll}>
        <PollPage />
      </PollContextProvider>
    );
  }

  if (didError) {
    return <Custom404 />;
  }

  return <FullPageLoader>{t("loading")}</FullPageLoader>;
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async ({ locale = "en", req }) => {
    return {
      props: {
        ...(await serverSideTranslations(locale, ["app"])),
        user: req.session.user ?? null,
      },
    };
  },
);

export default withSession(PollPageLoader);
