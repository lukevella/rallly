import {
  AlertCircleIcon,
  LockIcon,
  MapPinIcon,
  MenuIcon,
  MousePointerClickIcon,
} from "@rallly/icons";
import { cn } from "@rallly/ui";
import { useTranslation } from "next-i18next";
import React from "react";

import { Card } from "@/components/card";
import Discussion from "@/components/discussion";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { TextSummary } from "@/components/text-summary";
import { usePoll } from "@/contexts/poll";
import { useUserPreferences } from "@/contexts/preferences";
import { generateGradient } from "@/utils/color-hash";
import { preventWidows } from "@/utils/prevent-widows";

import PollSubheader from "./poll/poll-subheader";
import TruncatedLinkify from "./poll/truncated-linkify";
import { useTouchBeacon } from "./poll/use-touch-beacon";
import VoteIcon from "./poll/vote-icon";

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
      {poll.demo ? (
        <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-100 p-3 text-amber-600 shadow-sm">
          <AlertCircleIcon className="w-6" />
          <div>{t("demoPollNotice")}</div>
        </div>
      ) : null}
      {poll.closed ? (
        <div className="flex items-center gap-3 rounded-md border border-pink-200 bg-pink-100 p-3 text-pink-600 shadow-sm">
          <LockIcon className="w-6" />
          <div>{t("pollHasBeenLocked")}</div>
        </div>
      ) : null}

      <Card fullWidthOnMobile={false}>
        <div className="divide-y text-gray-600">
          <div
            className="h-2"
            style={{ background: generateGradient(poll.id) }}
          ></div>
          <div className="bg-pattern p-4">
            <div className="flex items-start gap-3">
              <div>
                <h1
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                  data-testid="poll-title"
                >
                  {preventWidows(poll.title)}
                </h1>
                <PollSubheader />
              </div>
            </div>
          </div>
          <div className="space-y-4 p-4">
            {poll.description ? (
              <div className="flex gap-4">
                <MenuIcon className="h-5 w-5 shrink-0 translate-y-0.5" />
                <div className="border-primary whitespace-pre-line leading-relaxed">
                  <TruncatedLinkify>
                    <TextSummary text={preventWidows(poll.description)} />
                  </TruncatedLinkify>
                </div>
              </div>
            ) : null}
            {poll.location ? (
              <div className="flex gap-4">
                <MapPinIcon className="h-5 w-5 translate-y-0.5" />
                <TruncatedLinkify>{poll.location}</TruncatedLinkify>
              </div>
            ) : null}
            <div className="flex gap-4">
              <MousePointerClickIcon className="h-5 w-5 shrink-0" />
              <div>
                <div className="flex gap-2.5">
                  <span className="inline-flex items-center space-x-1">
                    <VoteIcon type="yes" />
                    <span className="text-sm">{t("yes")}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <VoteIcon type="ifNeedBe" />
                    <span className="text-sm">{t("ifNeedBe")}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <VoteIcon type="no" />
                    <span className="text-sm">{t("no")}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
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
