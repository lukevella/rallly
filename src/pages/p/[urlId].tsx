import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";

import { ParticipantsProvider } from "@/components/participants-provider";
import { Poll } from "@/components/poll";
import { PollContextProvider } from "@/components/poll-context";
import { withSession } from "@/components/user-provider";
import { withSessionSsr } from "@/utils/auth";
import { trpcNext } from "@/utils/trpc";
import { withPageTranslations } from "@/utils/with-page-translations";

import { ParticipantLayout } from "../../components/layouts/participant-layout";
import { DayjsProvider } from "../../utils/dayjs";

const Page: NextPage = () => {
  const { query } = useRouter();
  const urlId = query.urlId as string;

  const pollQuery = trpcNext.poll.getByParticipantUrlId.useQuery({ urlId });

  const poll = pollQuery.data;

  if (poll) {
    return (
      <DayjsProvider>
        <ParticipantsProvider pollId={poll.id}>
          <ParticipantLayout>
            <PollContextProvider poll={poll} urlId={urlId} admin={false}>
              <Poll />
            </PollContextProvider>
          </ParticipantLayout>
        </ParticipantsProvider>
      </DayjsProvider>
    );
  }

  return null;
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

export default withSession(Page);
