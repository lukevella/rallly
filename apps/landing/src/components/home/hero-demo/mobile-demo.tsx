import { cn } from "@rallly/ui";
import type { TFunction } from "i18next";
import { GlobeIcon, UserIcon, UsersIcon } from "lucide-react";
import type { DemoDay, DemoVote } from "./demo-data";
import { formatDemoParts, getScores } from "./demo-data";
import { VoteIcon } from "./vote-icon";

const yourVotes: DemoVote[] = ["yes", "yes", "ifNeedBe"];

const TriState = ({ selected }: { selected?: DemoVote }) => (
  <div className="flex h-8 w-24 shrink-0 items-center rounded-lg border border-gray-200/60 bg-gray-100 p-0.5">
    {(["yes", "ifNeedBe", "no"] as const).map((vote) => {
      const isSelected = vote === selected;
      return (
        <span
          key={vote}
          className={cn(
            "flex h-full flex-1 items-center justify-center rounded-md",
            isSelected && "bg-white shadow-sm",
          )}
        >
          <VoteIcon
            vote={vote}
            className={cn("size-3.5", !isSelected && "text-gray-400")}
          />
        </span>
      );
    })}
  </div>
);

export const MobileDemo = ({
  locale,
  days,
  t,
}: {
  locale: string;
  days: DemoDay[];
  t: TFunction<"home">;
}) => {
  const format = formatDemoParts(locale);
  const scores = getScores(days);
  let optionIndex = -1;

  return (
    <div className="rounded-[2.2rem] border bg-white p-1.5 shadow-sm">
      <div className="flex h-[560px] flex-col overflow-hidden rounded-[1.8rem] border bg-white text-left">
        <div className="flex items-center justify-between border-gray-100 border-b px-3 py-3">
          <span className="flex items-center gap-2 font-medium text-gray-900 text-sm">
            <span className="flex size-6 items-center justify-center rounded-full bg-gray-100">
              <UserIcon className="size-3.5 text-gray-500" />
            </span>
            {t("heroDemoYou", {
              ns: "home",
              defaultValue: "You",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 border-gray-100 border-b px-3 py-2.5 text-gray-500 text-xs">
          <GlobeIcon className="size-3.5" />
          {t("heroDemoTimeZone", {
            ns: "home",
            defaultValue: "London time",
          })}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {days.slice(0, 3).map((day) => (
            <div key={day.date.toISOString()}>
              <div className="border-gray-100 border-b bg-gray-50/60 px-3 py-2 font-semibold text-gray-900 text-xs">
                {format.fullDay.format(day.date)}
              </div>
              {day.options.map((option) => {
                optionIndex += 1;
                return (
                  <div
                    key={option.start.toISOString()}
                    className="flex items-center justify-between gap-2 border-gray-100 border-b px-3 py-3"
                  >
                    <div className="min-w-0 flex-1 text-gray-800 text-xs">
                      {format.time.formatRange(option.start, option.end)}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-gray-400 text-xs">
                      <UsersIcon className="size-3.5" />
                      {scores[optionIndex]}
                    </div>
                    <TriState selected={yourVotes[optionIndex]} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-gray-100 border-t px-3 py-3">
          <span className="flex-1 rounded-lg border py-1.5 text-center text-gray-700 text-xs">
            {t("heroDemoDecline", {
              ns: "home",
              defaultValue: "Decline",
            })}
          </span>
          <span className="flex-[2] rounded-lg bg-indigo-500 py-1.5 text-center text-white text-xs">
            {t("heroDemoContinue", {
              ns: "home",
              defaultValue: "Continue",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
