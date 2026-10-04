import type { TFunction } from "i18next";
import { UserIcon } from "lucide-react";
import type { DemoDay, DemoVote } from "./demo-data";
import { formatDemoParts } from "./demo-data";
import { DemoFrame, DemoScreen } from "./demo-frame";
import { VoteActions } from "./vote-actions";
import { VoteCount } from "./vote-count";
import { VoteSelector } from "./vote-selector";

// Pre-selected votes for the first few options, so the demo opens looking
// like a poll someone has already started filling in.
const initialVotes: (DemoVote | undefined)[] = ["yes", "yes", "ifNeedBe"];

export const MobileDemo = ({
  locale,
  days,
  scores,
  t,
}: {
  locale: string;
  days: DemoDay[];
  scores: number[];
  t: TFunction<"home">;
}) => {
  const format = formatDemoParts(locale);
  const topScore = Math.max(...scores);
  let optionIndex = -1;

  return (
    <DemoFrame className="rounded-[1.8rem]">
      <DemoScreen className="relative flex h-[620px] flex-col rounded-[1.4rem] text-left">
        <div className="flex items-center justify-between border-gray-100 border-b px-3 py-3">
          <span className="flex items-center gap-2 font-medium text-gray-900 text-sm">
            <span className="flex size-6 items-center justify-center rounded-full bg-gray-100">
              <UserIcon className="size-3.5 text-gray-500" />
            </span>
            {t("heroDemoYou", { ns: "home", defaultValue: "You" })}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {days.map((day) => {
            const label = format.fullDay.format(day.date);
            return (
              <div key={label}>
                <div className="border-gray-100 border-b bg-gray-50/60 px-3 py-2 font-semibold text-gray-900 text-xs">
                  {label}
                </div>
                {day.options.map((option) => {
                  optionIndex += 1;
                  const time = format.time.formatRange(
                    option.start,
                    option.end,
                  );
                  const score = scores[optionIndex];
                  return (
                    <div
                      key={option.start.toISOString()}
                      className="flex items-center justify-between gap-2 border-gray-100 border-b px-3 py-3"
                    >
                      <div className="min-w-0 flex-1 text-gray-800 text-xs">
                        {time}
                      </div>
                      <VoteCount
                        count={score}
                        highlight={score === topScore}
                        className="mr-2 shrink-0"
                      />
                      <VoteSelector
                        label={`${label} ${time}`}
                        defaultValue={initialVotes[optionIndex]}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <VoteActions />
      </DemoScreen>
    </DemoFrame>
  );
};
