import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import FullPageLoader from "@/components/full-page-loader";
import { ParticipantsProvider } from "@/components/participants-provider";
import { Poll } from "@/components/poll";
import { PollContextProvider } from "@/components/poll-context";
import { withSession } from "@/components/user-provider";
import { withSessionSsr } from "@/utils/auth";
import { trpcNext } from "@/utils/trpc";
import { withPageTranslations } from "@/utils/with-page-translations";

import StandardLayout from "../../components/layouts/standard-layout";
import ModalProvider from "../../components/modal/modal-provider";
import { DayjsProvider } from "../../utils/dayjs";

const PollPageLoader: NextPage = () => {
  const { query } = useRouter();
  const { t } = useTranslation("app");
  const urlId = query.urlId as string;

  const pollQuery = trpcNext.poll.getByParticipantUrlId.useQuery({ urlId });

  const poll = pollQuery.data;

  if (poll) {
    return (
      <ModalProvider>
        <DayjsProvider>
          <ParticipantsProvider pollId={poll.id}>
            <StandardLayout>
              <PollContextProvider poll={poll} urlId={urlId} admin={false}>
                <Poll />
              </PollContextProvider>
            </StandardLayout>
          </ParticipantsProvider>
        </DayjsProvider>
      </ModalProvider>
    );
  }

  return <FullPageLoader>{t("loading")}</FullPageLoader>;
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  withPageTranslations(["common", "app", "errors"]),
  {
    onPrefetch: async (ssg, ctx) => {
      await ssg.poll.getByParticipantUrlId.fetch({
        urlId: ctx.params?.urlId as string,
      });
    },
  },
);

export default withSession(PollPageLoader);
