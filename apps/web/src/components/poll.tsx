import { ExclamationIcon, LockClosedIcon } from "@rallly/icons";
import { useTranslation } from "next-i18next";
import React from "react";

import Discussion from "@/components/discussion";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { preventWidows } from "@/utils/prevent-widows";

import { useParticipants } from "./participants-provider";
import PollSubheader from "./poll/poll-subheader";
import TruncatedLinkify from "./poll/truncated-linkify";
import { useTouchBeacon } from "./poll/use-touch-beacon";
import { UserAvatarProvider } from "./poll/user-avatar";
import VoteIcon from "./poll/vote-icon";
import { usePoll } from "./poll-context";

const checkIfWideScreen = () => window.innerWidth > 640;

export const Poll = (props: { children?: React.ReactNode }) => {
  const { t } = useTranslation();
  const { poll } = usePoll();

  useTouchBeacon(poll.id);

  const { participants } = useParticipants();
  const names = React.useMemo(
    () => participants?.map(({ name }) => name) ?? [],
    [participants],
  );

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
    <UserAvatarProvider seed={poll.id} names={names}>
      <div>
        <div className="mx-auto max-w-full space-y-3 sm:space-y-4 lg:mx-0">
          {props.children}
          {poll.demo ? (
            <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-100 p-3 text-amber-600 shadow-sm">
              <ExclamationIcon className="w-6" />
              <div>{t("demoPollNotice")}</div>
            </div>
          ) : null}
          {poll.closed ? (
            <div className="flex items-center gap-3 rounded-md border border-pink-200 bg-pink-100 p-3 text-pink-600 shadow-sm">
              <LockClosedIcon className="w-6" />
              <div>{t("pollHasBeenLocked")}</div>
            </div>
          ) : null}
          <div className="rounded-md border bg-white shadow-sm md:overflow-hidden">
            <div className="p-4">
              <div className="space-y-3">
                <div>
                  <div
                    className="text-xl font-semibold text-slate-800 sm:text-2xl"
                    data-testid="poll-title"
                  >
                    {preventWidows(poll.title)}
                  </div>
                  <PollSubheader />
                </div>
                {poll.description ? (
                  <div className="border-primary whitespace-pre-line">
                    <TruncatedLinkify>
                      {preventWidows(poll.description)}
                    </TruncatedLinkify>
                  </div>
                ) : null}
                {poll.location ? (
                  <div>
                    <div className="text-sm text-slate-500">
                      {t("location")}
                    </div>
                    <TruncatedLinkify>{poll.location}</TruncatedLinkify>
                  </div>
                ) : null}
                <div>
                  <div className="mb-2 text-sm text-slate-500">
                    {t("possibleAnswers")}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="yes" />
                      <span>{t("yes")}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="ifNeedBe" />
                      <span>{t("ifNeedBe")}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="no" />
                      <span>{t("no")}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <React.Suspense fallback={null}>
            {participants ? (
              <div className="overflow-hidden rounded-md border bg-white shadow-sm">
                <PollComponent />
              </div>
            ) : null}
          </React.Suspense>

          <React.Suspense fallback={<div className="p-4">{t("loading")}</div>}>
            <Discussion />
          </React.Suspense>
        </div>
      </div>
    </UserAvatarProvider>
  );
};
