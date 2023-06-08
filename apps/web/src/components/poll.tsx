import { LockIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import { useTranslation } from "next-i18next";
import React from "react";

import { Card } from "@/components/card";
import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { usePoll } from "@/contexts/poll";
import { useUserPreferences } from "@/contexts/preferences";

import { useTouchBeacon } from "./poll/use-touch-beacon";

const checkIfWideScreen = () => window.innerWidth > 640;

export const Poll = () => {
  const { t } = useTranslation();
  const poll = usePoll();

  useTouchBeacon(poll.id);

  React.useEffect(() => {
    const listener = () => setIsWideScreen(checkIfWideScreen());

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  const userPreferences = useUserPreferences();

  const [isWideScreen, setIsWideScreen] = React.useState(checkIfWideScreen);
  const PollComponent = isWideScreen ? DesktopPoll : MobilePoll;

  if (!userPreferences) {
    return null;
  }

  return (
    <div className={cn("space-y-3 sm:space-y-4")}>
      {poll.closed ? (
        <div className="flex items-center gap-3 rounded-md border border-pink-200 bg-pink-100 p-3 text-pink-600 shadow-sm">
          <LockIcon className="w-6" />
          <div>{t("pollHasBeenLocked")}</div>
        </div>
      ) : null}
      <EventCard />
      <Card fullWidthOnMobile={false}>
        <PollComponent />
      </Card>
      <hr className="my-4" />
      <Card fullWidthOnMobile={false}>
        <Discussion />
      </Card>
    </div>
  );
};
