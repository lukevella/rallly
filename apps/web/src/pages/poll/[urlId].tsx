import { withSessionSsr } from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { GetServerSideProps } from "next";

import { getStandardLayout } from "@/components/layouts/standard-layout";
import { AdminControls } from "@/components/poll/participant-page/admin-controls";
import ParticipantPage from "@/components/poll/participant-page/participant-page";
import { LegacyPollContextProvider } from "@/components/poll/participant-page/poll-context-provider";
import { NextPageWithLayout } from "@/types";
import { withPageTranslations } from "@/utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  return (
    <LegacyPollContextProvider>
      <div className="flex min-w-0 grow flex-col">
        <AdminControls />
        <ParticipantPage />
      </div>
    </LegacyPollContextProvider>
  );
};

Page.getLayout = getStandardLayout;

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  [
    withPageTranslations(),
    async (ctx) => {
      let userId: string | null = null;
      if (ctx.query.token) {
        const res = await decryptToken<{ userId: string }>(
          ctx.query.token as string,
        );
        if (res) {
          userId = res.userId;
        }
      }
      return {
        props: {
          forceUserId: userId,
        },
      };
    },
  ],
  {
    onPrefetch: async (ssg, ctx) => {
      const poll = await ssg.polls.get.fetch({
        urlId: ctx.params?.urlId as string,
      });

      await ssg.polls.participants.list.prefetch({
        pollId: poll.id,
      });
    },
  },
);

export default Page;
