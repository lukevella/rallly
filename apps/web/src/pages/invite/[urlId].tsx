import { withSessionSsr } from "@rallly/backend/next";
import { decryptToken } from "@rallly/backend/session";
import { InformationCircleIcon } from "@rallly/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { GetServerSideProps } from "next";
import Link from "next/link";
import React from "react";

import ParticipantPage from "@/components/poll/participant-page/participant-page";
import { usePoll } from "@/components/poll-context";
import { TimeZoneCommand } from "@/components/time-zone-picker/time-zone-select";
import Tooltip from "@/components/tooltip";
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
        <Tooltip
          content={
            <Trans
              i18nKey="mangeLinkTooltip"
              defaults="You created this poll, so you have exclusive access to its management page"
            />
          }
        >
          <InformationCircleIcon className="h-4" />
        </Tooltip>
      </span>
    </div>
  );
};

const Preferences = () => {
  const [isTimeZoneDialogOpen, setIsTimeZoneDialogOpen] = React.useState(false);
  const { targetTimeZone, setTargetTimeZone } = usePoll();
  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-8">
      <div className="flex items-center justify-center">
        <Popover
          open={isTimeZoneDialogOpen}
          onOpenChange={setIsTimeZoneDialogOpen}
        >
          <PopoverTrigger asChild={true}>
            <button
              type="button"
              className="text-muted-foreground text-sm hover:underline"
              onClick={() => {
                setIsTimeZoneDialogOpen(true);
              }}
            >
              <Trans
                defaults="Show times in {targetTimeZone}"
                i18nKey="showTimesIn"
                values={{ targetTimeZone }}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent align="center" className="p-0">
            <TimeZoneCommand
              value={targetTimeZone}
              onSelect={(newTimeZone) => {
                setTargetTimeZone(newTimeZone);
                setIsTimeZoneDialogOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

const Page = ({ forceUserId }: { forceUserId: string }) => {
  return (
    <UserProvider forceUserId={forceUserId}>
      <div>
        <ParticipantPage>
          <div className="mt-3 grid gap-4 sm:mt-8">
            <GoToApp />
            <Preferences />
          </div>
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
