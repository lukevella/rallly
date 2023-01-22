import { NextPage } from "next";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import React from "react";

import FullPageLoader from "@/components/full-page-loader";
import { ParticipantsProvider } from "@/components/participants-provider";
import Poll from "@/components/poll";
import { PollContextProvider } from "@/components/poll-context";
import StandardLayout from "@/components/standard-layout";
import Custom404 from "@/pages/404";
import { trpc } from "@/utils/trpc";

export const PollPage: NextPage<{ admin: boolean }> = ({ admin }) => {
  const { query } = useRouter();
  const { t } = useTranslation("app");
  const urlId = query.urlId as string;
  const [notFound, setNotFound] = React.useState(false);

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
        <StandardLayout>
          <PollContextProvider poll={poll} urlId={urlId} admin={admin}>
            <Poll />
          </PollContextProvider>
        </StandardLayout>
      </ParticipantsProvider>
    );
  }

  if (notFound) {
    return <Custom404 />;
  }

  return <FullPageLoader>{t("loading")}</FullPageLoader>;
};
