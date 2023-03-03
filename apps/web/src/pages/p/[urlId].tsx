import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";

import { ParticipantsProvider } from "@/components/participants-provider";
import { Poll } from "@/components/poll";
import { PollContextProvider } from "@/components/poll-context";
import { UserProvider, useUser } from "@/components/user-provider";
import { decryptToken, withSessionSsr } from "@/utils/auth";
import { trpc } from "@/utils/trpc";
import { withPageTranslations } from "@/utils/with-page-translations";

import StandardLayout from "../../components/layouts/standard-layout";
import ModalProvider from "../../components/modal/modal-provider";
import { NextPageWithLayout } from "../../types";

const Page: NextPageWithLayout<{
  urlId: string;
  forceUserId: string | null;
}> = ({ urlId, forceUserId }) => {
  const pollQuery = trpc.polls.getByParticipantUrlId.useQuery({ urlId });

  const { user } = useUser();
  const poll = pollQuery.data;

  const { t } = useTranslation("app");
  if (poll) {
    return (
      <>
        <Head>
          <title>{poll.title}</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <UserProvider forceUserId={forceUserId ?? undefined}>
          <ParticipantsProvider pollId={poll.id}>
            <PollContextProvider poll={poll} urlId={urlId} admin={false}>
              <ModalProvider>
                <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
                  {user.id === poll.user.id ? (
                    <Link
                      className="btn-default"
                      href={`/admin/${poll.adminUrlId}`}
                    >
                      &larr; {t("goToAdmin")}
                    </Link>
                  ) : null}
                  <Poll />
                </div>
              </ModalProvider>
            </PollContextProvider>
          </ParticipantsProvider>
        </UserProvider>
      </>
    );
  }

  return null;
};

Page.getLayout = function getLayout(page) {
  return <StandardLayout>{page}</StandardLayout>;
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  [
    withPageTranslations(["common", "app", "errors"]),
    async (ctx) => {
      let userId: string | null = null;
      if (ctx.query.token) {
        const res = await decryptToken<{ userId: string }>(
          ctx.query.token as string,
        );
        userId = res?.userId;
      }
      return {
        props: {
          urlId: ctx.query.urlId as string,
          forceUserId: userId,
        },
      };
    },
  ],
  {
    onPrefetch: async (ssg, ctx) => {
      await ssg.polls.getByParticipantUrlId.fetch({
        urlId: ctx.params?.urlId as string,
      });
    },
  },
);

export default Page;
