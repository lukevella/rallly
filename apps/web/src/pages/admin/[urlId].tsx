import { withAuthIfRequired, withSessionSsr } from "@rallly/backend/next";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import FullPageLoader from "@/components/full-page-loader";
import { getStandardLayout } from "@/components/layouts/standard-layout";
import { ParticipantsProvider } from "@/components/participants-provider";
import { Poll } from "@/components/poll";
import { PollContextProvider } from "@/components/poll-context";
import { usePollByAdmin } from "@/utils/trpc/hooks";
import { withPageTranslations } from "@/utils/with-page-translations";

import { AdminControls } from "../../components/admin-control";
import ModalProvider from "../../components/modal/modal-provider";
import { NextPageWithLayout } from "../../types";

const Page: NextPageWithLayout<{ urlId: string }> = ({ urlId }) => {
  const { t } = useTranslation("app");

  const pollQuery = usePollByAdmin();

  const poll = pollQuery.data;

  if (poll) {
    return (
      <>
        <Head>
          <title>{t("adminPollTitle", { title: poll.title })}</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <ParticipantsProvider pollId={poll.id}>
          <PollContextProvider poll={poll} urlId={urlId} admin={true}>
            <ModalProvider>
              <div className="flex flex-col space-y-3 p-3 sm:space-y-4 sm:p-4">
                <AdminControls>
                  <Poll />
                </AdminControls>
              </div>
            </ModalProvider>
          </PollContextProvider>
        </ParticipantsProvider>
      </>
    );
  }

  return <FullPageLoader>{t("loading")}</FullPageLoader>;
};

Page.getLayout = getStandardLayout;

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  [
    withAuthIfRequired,
    withPageTranslations(["common", "app", "errors"]),
    async (ctx) => {
      return {
        props: {
          urlId: ctx.query.urlId as string,
        },
      };
    },
  ],
  {
    onPrefetch: async (ssg, ctx) => {
      const poll = await ssg.polls.getByAdminUrlId.fetch({
        urlId: ctx.params?.urlId as string,
      });

      await ssg.polls.participants.list.prefetch({
        pollId: poll.id,
      });
    },
  },
);

export default Page;
