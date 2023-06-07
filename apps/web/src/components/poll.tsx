import {
  AlertCircleIcon,
  CalendarPlusIcon,
  CheckCircleIcon,
  LockIcon,
  MailPlusIcon,
  MapPinIcon,
  MenuIcon,
  MousePointerClickIcon,
} from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import dayjs from "dayjs";
import { useTranslation } from "next-i18next";
import React from "react";

import { Card } from "@/components/card";
import { DateIconInner } from "@/components/date-icon";
import Discussion from "@/components/discussion";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useParticipants } from "@/components/participants-provider";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { useOptions } from "@/components/poll-context";
import { TextSummary } from "@/components/text-summary";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { useUserPreferences } from "@/contexts/preferences";
import { TimePreferences } from "@/contexts/time-preferences";
import { generateGradient } from "@/utils/color-hash";
import { preventWidows } from "@/utils/prevent-widows";

import PollSubheader from "./poll/poll-subheader";
import TruncatedLinkify from "./poll/truncated-linkify";
import { useTouchBeacon } from "./poll/use-touch-beacon";
import VoteIcon from "./poll/vote-icon";

const checkIfWideScreen = () => window.innerWidth > 640;

const FinalDate = () => {
  const poll = usePoll();
  const { options } = useOptions();

  const selectedOptionIndex = options.findIndex(
    (option) => option.optionId === poll.selectedOptionId,
  );

  const selectedOption = options[selectedOptionIndex];
  const { participants } = useParticipants();
  if (!selectedOption) {
    return null;
  }
  return (
    <>
      <Card>
        <div>
          <div className="flex items-center justify-between bg-green-500 p-2 pr-4 text-sm  font-semibold text-green-50 shadow-sm">
            <span className="inline-flex items-center gap-x-2 ">
              <CheckCircleIcon className="h-5 w-5" />
              <div className="font-medium">
                <Trans i18nKey="dateSelectedMessage" defaults="Booked!" />
              </div>
            </span>
          </div>
        </div>
        <div className="bg-pattern px-3 pb-5 pt-3">
          <div className="flex-col-rev flex justify-between">
            <div className="flex gap-x-4">
              <div>
                <DateIconInner
                  dow={selectedOption.dow}
                  month={selectedOption.month}
                  day={selectedOption.day}
                />
              </div>
              <div>
                <div className="font-semibold">{poll.title}</div>
                <div className="text-muted-foreground text-sm">
                  {dayjs(selectedOption.date).format(
                    selectedOption.type === "date" ? "LL" : "LLL",
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-muted-foreground mb-1 text-xs">
                    <Trans
                      i18nKey="participantCount"
                      values={{ count: participants.length }}
                    />
                  </div>
                  <ParticipantAvatarBar participants={participants} max={8} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-x-2 border-t bg-gray-50 p-3">
          <Button icon={MailPlusIcon} className="">
            <Trans
              i18nKey="sendCalendarInvite"
              defaults="Send Calender Invite"
            />
          </Button>
          <Button icon={CalendarPlusIcon}>
            <Trans i18nKey="addToCalendar" defaults="Add to Calendar" />
          </Button>
        </div>
      </Card>
    </>
  );
};

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
    <div className="space-y-3 sm:space-y-4">
      {poll.selectedOptionId ? (
        <>
          <FinalDate />
          <hr />
        </>
      ) : null}
      <div
        className={cn("space-y-3 sm:space-y-4", {
          " transition-opacity hover:opacity-100": poll.selectedOptionId,
        })}
      >
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
                  <MenuIcon className="h-5 shrink-0 translate-y-0.5" />
                  <div className="border-primary whitespace-pre-line leading-relaxed">
                    <TruncatedLinkify>
                      <TextSummary text={preventWidows(poll.description)} />
                    </TruncatedLinkify>
                  </div>
                </div>
              ) : null}
              {poll.location ? (
                <div className="flex gap-4">
                  <MapPinIcon className="h-5 translate-y-0.5" />
                  <TruncatedLinkify>{poll.location}</TruncatedLinkify>
                </div>
              ) : null}
              <div className="flex gap-4">
                <MousePointerClickIcon className="h-5 shrink-0" />
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
        {poll.timeZone ? <TimePreferences /> : null}
        <Card fullWidthOnMobile={false}>
          <PollComponent />
        </Card>
        <hr className="my-4" />
        <Card fullWidthOnMobile={false}>
          <Discussion />
        </Card>
      </div>
    </div>
  );
};
