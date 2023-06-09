import { withSessionSsr } from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { ArrowLeftIcon, ArrowUpLeftIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { GetServerSideProps } from "next";
import Link from "next/link";

import ParticipantPage from "@/components/poll/participant-page/participant-page";
import { LegacyPollContextProvider } from "@/components/poll/participant-page/poll-context-provider";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { UserProvider, useUser } from "@/components/user-provider";
import { TimePreferences } from "@/contexts/time-preferences";
import { withPageTranslations } from "@/utils/with-page-translations";

const GoToApp = () => {
  const { poll } = usePoll();
  const { user } = useUser();

  if (poll.user?.id !== user.id) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild>
        <Link href={`/poll/${poll.id}`}>
          <ArrowUpLeftIcon className="h-4 w-4" />
          <Trans i18nKey="manage" />
        </Link>
      </Button>
    </div>
  );
};

const Page = ({ forceUserId }: { forceUserId: string }) => {
  return (
    <UserProvider forceUserId={forceUserId}>
      <LegacyPollContextProvider>
        <div className="">
          <svg
            className="absolute inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(800px_800px_at_center,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
                width={220}
                height={220}
                x="50%"
                y={-1}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 220V.5H220" fill="none" />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              strokeWidth={0}
              fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)"
            />
          </svg>
          <div className="mx-auto max-w-4xl space-y-4 p-3 sm:py-8">
            <div className="mx-auto flex max-w-4xl items-start gap-x-4">
              <div className="grow">
                <GoToApp />
              </div>
              <div>
                <TimePreferences />
              </div>
            </div>
            <hr />
            <ParticipantPage />
            <div className="mt-4 space-y-4 text-center text-gray-500">
              <div className="py-8">
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
          </div>
        </div>
      </LegacyPollContextProvider>
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
