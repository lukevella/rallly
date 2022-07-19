import { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import FullPageLoader from "@/components/full-page-loader";
import { PollContextProvider } from "@/components/poll-context";
import { withSession } from "@/components/session";

import { ParticipantsProvider } from "../components/participants-provider";
import { withSessionSsr } from "../utils/auth";
import { trpc } from "../utils/trpc";
import { withPageTranslations } from "../utils/with-page-translations";
import Custom404 from "./404";

const PollPage = dynamic(() => import("@/components/poll"), { ssr: false });

const PollPageLoader: NextPage = () => {
  const { query, asPath } = useRouter();
  const { t } = useTranslation("app");
  const urlId = query.urlId as string;
  const [notFound, setNotFound] = React.useState(false);

  const admin = /^\/admin/.test(asPath);
  const pollQuery = trpc.useQuery(["polls.get", { urlId, admin }], {
    onError: () => {
      setNotFound(true);
    },
    retry: false,
  });

  const poll = pollQuery.data;

  if (poll) {
    return (
      <ParticipantsProvider pollId={poll.id}>
        <PollContextProvider poll={poll} urlId={urlId} admin={admin}>
          <PollPage />
        </PollContextProvider>
      </ParticipantsProvider>
    );
  }

  if (notFound) {
    return <Custom404 />;
  }

  return <FullPageLoader>{t("loading")}</FullPageLoader>;
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  withPageTranslations(["common", "app"]),
);

export default withSession(PollPageLoader);
