import { withSessionSsr } from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { InfoIcon } from "@rallly/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { GetServerSideProps } from "next";
import Link from "next/link";

import ParticipantPage from "@/components/poll/participant-page/participant-page";
import { LegacyPollContextProvider } from "@/components/poll/participant-page/poll-context-provider";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { UserProvider, useUser } from "@/components/user-provider";
import { withPageTranslations } from "@/utils/with-page-translations";

const GoToApp = () => {
  const { poll } = usePoll();
  const { user } = useUser();

  if (poll.user?.id !== user.id) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium tracking-tight">
        <Link className="text-link text-sm" href={`/poll/${poll.id}`}>
          <Trans i18nKey="manage" />
        </Link>
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="h-4" />
          </TooltipTrigger>
          <TooltipContent>
            <Trans
              i18nKey="mangeLinkTooltip"
              defaults="You created this poll, so you have exclusive access to its management page"
            />
          </TooltipContent>
        </Tooltip>
      </span>
    </div>
  );
};

const Page = ({ forceUserId }: { forceUserId: string }) => {
  return (
    <UserProvider forceUserId={forceUserId}>
      <LegacyPollContextProvider>
        <div className="space-y-4 py-8">
          <GoToApp />
          <ParticipantPage />
          <div className="mt-4 space-y-4 text-center text-gray-500">
            <div>
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
