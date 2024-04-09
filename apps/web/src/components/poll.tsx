"use client";
import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { CalendarCheck2Icon, PauseCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Trans } from "react-i18next";

import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { VotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/contexts/poll";

import { useTouchBeacon } from "./poll/use-touch-beacon";

const checkIfWideScreen = () => window.innerWidth > 640;

export const Poll = () => {
  const poll = usePoll();
  useTouchBeacon(poll.id);

  React.useEffect(() => {
    const listener = () => setIsWideScreen(checkIfWideScreen());

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  const [isWideScreen, setIsWideScreen] = React.useState(checkIfWideScreen);
  const PollComponent = isWideScreen ? DesktopPoll : MobilePoll;

  return (
    <div className={cn("space-y-3 sm:space-y-6")}>
      {poll.status === "paused" ? (
        <div className="flex flex-col gap-x-4 gap-y-1.5 rounded-lg bg-gray-700 px-4 py-3 text-sm lg:flex-row">
          <div className="flex items-center gap-x-2.5">
            <PauseCircleIcon className="size-4 text-gray-100" />
            <div className="font-medium text-gray-50">
              <Trans i18nKey="pollStatusPaused" />
            </div>
          </div>
          <div className="text-gray-100">
            <Trans
              i18nKey="pollStatusPausedDescription"
              defaults="Votes cannot be submitted or edited."
            />
          </div>
        </div>
      ) : null}
      {poll.event ? (
        <div className="flex flex-col gap-x-4 gap-y-1.5 rounded-lg bg-indigo-600 px-4 py-3 text-sm text-indigo-50 lg:flex-row">
          <div className="flex items-center gap-x-2.5">
            <CalendarCheck2Icon className="size-4 text-indigo-100" />
            <div className="font-medium">
              <Trans i18nKey="pollStatusFinalized" />
            </div>
          </div>
          <div className="text-indigo-100">
            <Trans
              i18nKey="pollStatusFinalizedDescription"
              defaults="Votes cannot be submitted or edited."
            />
          </div>
        </div>
      ) : null}
      <EventCard />
      {!poll.event ? (
        <>
          <VotingForm>
            <PollComponent />
          </VotingForm>
          {poll.disableComments ? null : (
            <>
              <hr className="my-4" />
              <Discussion />
            </>
          )}
        </>
      ) : null}

      <div className="mt-4 space-y-4 text-center text-gray-500">
        <div className="py-8">
          <Trans
            defaults="Powered by <a>{name}</a>"
            i18nKey="poweredByRallly"
            values={{ name: "rallly.co" }}
            components={{
              a: (
                <Link
                  prefetch={false}
                  className="hover:text-primary-600 rounded-none border-b border-b-gray-500 font-semibold"
                  href={`https://rallly.co?utm_source=poll&utm_medium=referral&utm_campaign=poll_referral_${poll.id}`}
                />
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
};
