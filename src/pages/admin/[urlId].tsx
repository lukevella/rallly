import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import FullPageLoader from "@/components/full-page-loader";
import StandardLayout from "@/components/layouts/standard-layout";
import { ParticipantsProvider } from "@/components/participants-provider";
import { Poll } from "@/components/poll";
import { PollContextProvider } from "@/components/poll-context";
import { withSession } from "@/components/user-provider";
import { withSessionSsr } from "@/utils/auth";
import { trpcNext } from "@/utils/trpc";
import { withPageTranslations } from "@/utils/with-page-translations";

import { AdminControls } from "../../components/admin-control";

const PollPageLoader: NextPage = () => {
  const { query } = useRouter();
  const { t } = useTranslation("app");
  const urlId = query.urlId as string;

  const pollQuery = trpcNext.poll.getByAdminUrlId.useQuery(
    { urlId },
    {
      retry: false,
    },
  );

  const poll = pollQuery.data;

  if (poll) {
    return (
      <ParticipantsProvider pollId={poll.id}>
        <StandardLayout>
          <PollContextProvider poll={poll} urlId={urlId} admin={true}>
            <div className="flex flex-col space-y-3 p-3 sm:space-y-4 sm:p-4">
              <AdminControls />
              <Poll />
            </div>
          </PollContextProvider>
        </StandardLayout>
      </ParticipantsProvider>
    );
  }

  return <FullPageLoader>{t("loading")}</FullPageLoader>;
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  withPageTranslations(["common", "app", "errors"]),
  {
    onPrefetch: async (ssg, ctx) => {
      await ssg.poll.getByAdminUrlId.fetch({
        urlId: ctx.params?.urlId as string,
      });
    },
  },
);

export default withSession(PollPageLoader);
