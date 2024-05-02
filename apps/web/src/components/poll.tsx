"use client";
import { cn } from "@rallly/ui";
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
    <div className={cn("space-y-3 lg:space-y-4")}>
      <EventCard />
      <VotingForm>
        <PollComponent />
      </VotingForm>
      {poll.disableComments ? null : <Discussion />}
      <div className="py-4 text-center text-sm text-gray-500">
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
  );
};
