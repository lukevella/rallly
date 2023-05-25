import { withSessionSsr } from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { ExternalLinkIcon } from "@rallly/icons";
import { GetServerSideProps } from "next";
import Link from "next/link";

import ParticipantPage from "@/components/poll/participant-page/participant-page";
import { Trans } from "@/components/trans";
import { UserProvider, useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";
import { withPageTranslations } from "@/utils/with-page-translations";

const GoToApp = () => {
  const poll = usePoll();
  const { user } = useUser();

  if (poll?.userId !== user.id) {
    return null;
  }

  return (
    <div className="pt-8 text-center">
      <span className="group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium tracking-tight">
        <Trans
          defaults="<a>Manage</a>"
          i18nKey="goToApp"
          components={{
            a: <Link className="text-link" href={`/poll/${poll.id}`} />,
          }}
        />
        <ExternalLinkIcon className="h-5" />
      </span>
    </div>
  );
};

const Page = ({ forceUserId }: { forceUserId: string }) => {
  return (
    <UserProvider forceUserId={forceUserId}>
      <div>
        <ParticipantPage>
          <GoToApp />
        </ParticipantPage>
        <div className="pb-16 text-center text-gray-500">
          <Trans
            defaults="Powered by <a>{name}</a>"
            i18nKey="poweredByRallly"
            values={{ name: "rallly.co" }}
            components={{
              a: (
                <Link
                  className="hover:text-primary-600 rounded-none border-b border-b-gray-500 font-semibold"
                  href="https://rallly.co"
                />
              ),
            }}
          />
        </div>
      </div>
    </UserProvider>
  );
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  [
    withPageTranslations(),
    async (ctx) => {
      if (ctx.query.token) {
        const res = await decryptToken<{ userId: string }>(
          ctx.query.token as string,
        );

        if (res) {
          return {
            props: {
              forceUserId: res.userId,
            },
          };
        }
      }

      return { props: {} };
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
