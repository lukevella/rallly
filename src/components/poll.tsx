import { useTranslation } from "next-i18next";
import React from "react";

import Discussion from "@/components/discussion";
import LockClosed from "@/components/icons/lock-closed.svg";
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
  const { t } = useTranslation("app");
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
          {poll.closed ? (
            <div className="flex items-center gap-3 border border-pink-200 bg-pink-100 p-3 text-pink-600 md:mb-4 md:rounded-md md:shadow-sm">
              <div className="rounded-md">
                <LockClosed className="w-5" />
              </div>
              <div>{t("pollHasBeenLocked")}</div>
            </div>
          ) : null}
          <div className="rounded-md border bg-white shadow-sm md:overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="space-y-3">
                <div>
                  <div
                    className="mb-1 text-2xl font-semibold text-slate-800 sm:text-3xl"
                    data-testid="poll-title"
                  >
                    {preventWidows(poll.title)}
                  </div>
                  <PollSubheader />
                </div>
                {poll.description ? (
                  <div className="border-primary whitespace-pre-line lg:text-lg">
                    <TruncatedLinkify>
                      {preventWidows(poll.description)}
                    </TruncatedLinkify>
                  </div>
                ) : null}
                {poll.location ? (
                  <div className="lg:text-lg">
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
                      <span className="text-xs text-slate-500">{t("yes")}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="ifNeedBe" />
                      <span className="text-xs text-slate-500">
                        {t("ifNeedBe")}
                      </span>
                    </span>
                    <span className="inline-flex items-center space-x-1">
                      <VoteIcon type="no" />
                      <span className="text-xs text-slate-500">{t("no")}</span>
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
