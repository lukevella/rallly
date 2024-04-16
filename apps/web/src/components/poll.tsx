"use client";
import { cn } from "@rallly/ui";
import { CalendarCheckIcon, PauseIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Trans } from "react-i18next";

import { Attendees } from "@/components/attendees";
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
      {poll.event ? (
        <div className="flex flex-col gap-x-4 gap-y-1.5 rounded-lg bg-green-600 px-4 py-3 text-sm text-green-50 lg:flex-row">
          <div className="flex items-center gap-x-2.5">
            <CalendarCheckIcon className="size-4 text-green-100" />
            <div className="font-medium">
              <Trans i18nKey="pollStatusFinalized" />
            </div>
          </div>
          <div className="text-green-50">
            <Trans i18nKey="pollStatusFinalizedDescription" />
          </div>
        </div>
      ) : null}
      <EventCard />
      {poll.status === "paused" ? (
        <div className="flex flex-col gap-x-4 gap-y-1.5 rounded-lg bg-gray-200 px-4 py-3 text-sm text-gray-600 lg:flex-row">
          <div className="flex items-center gap-x-2.5">
            <PauseIcon className="size-4" />
            <div className="font-medium ">
              <Trans i18nKey="pollStatusPaused" />
            </div>
          </div>
          <div className="">
            <Trans
              i18nKey="pollStatusPausedDescription"
              defaults="Votes cannot be submitted or edited."
            />
          </div>
        </div>
      ) : null}
      {!poll.event ? (
        <>
          <VotingForm>
            <PollComponent />
          </VotingForm>
          {poll.disableComments ? (
            <p className="text-muted-foreground text-center text-sm">
              <Trans
                i18nKey="commentsDisabled"
                defaults="Comments have been disabled"
              />
            </p>
          ) : (
            <Discussion />
          )}
        </>
      ) : (
        <Attendees optionId={poll.event.optionId} />
      )}

      <div className="mt-4 space-y-4 text-center text-sm text-gray-500">
        <div className="pb-8">
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
