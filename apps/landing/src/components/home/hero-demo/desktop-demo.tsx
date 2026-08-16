import { cn } from "@rallly/ui";
import type { TFunction } from "i18next";
import {
  ClockIcon,
  MapPinIcon,
  Maximize2Icon,
  PlusIcon,
  UserIcon,
} from "lucide-react";
import * as React from "react";
import type { DemoDay } from "./demo-data";
import { demoParticipants, formatDemoParts, getInitials } from "./demo-data";
import { DemoFrame, DemoScreen } from "./demo-frame";
import { VoteCount } from "./vote-count";
import { VoteIcon } from "./vote-icon";

export const DesktopDemo = ({
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
  const optionCount = scores.length;
  const topScore = Math.max(...scores);

  const monthGroups: { label: string; span: number }[] = [];
  for (const day of days) {
    const label = `${format.month.format(day.date).toUpperCase()} ${format.year.format(day.date)}`;
    const last = monthGroups.at(-1);
    if (last?.label === label) {
      last.span += day.options.length;
    } else {
      monthGroups.push({ label, span: day.options.length });
    }
  }

  return (
    <DemoFrame className="rounded-2xl lg:rounded-[2.2rem]">
      <DemoScreen className="rounded-xl bg-gray-100 p-4 sm:p-6 lg:rounded-[1.8rem]">
        <div className="space-y-3 text-left">
          <div className="overflow-hidden rounded-xl border border-gray-200/60 bg-white">
            <div className="h-1.5 bg-linear-to-r from-indigo-500 to-violet-500" />
            <div className="space-y-3 p-4 sm:p-5">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg tracking-tight">
                  {t("heroDemoTitle", {
                    ns: "home",
                    defaultValue: "Q3 Board Meeting",
                  })}
                </h3>
                <p className="mt-1 max-w-[70ch] text-gray-600 text-sm">
                  {t("heroDemoDescription", {
                    ns: "home",
                    defaultValue:
                      "Please pick every time you could attend. We'll go with the one that works for everyone.",
                  })}
                </p>
              </div>
              <div className="space-y-1.5 text-gray-600 text-sm">
                <div className="flex items-center gap-2">
                  <UserIcon className="size-4 text-gray-400" />
                  {t("heroDemoOrganizer", {
                    ns: "home",
                    defaultValue: "Organized by Sofia Almeida",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="size-4 text-gray-400" />
                  {t("heroDemoLocation", {
                    ns: "home",
                    defaultValue: "Riverside Community Center",
                  })}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {t("heroDemoResponseOptions", {
                    ns: "home",
                    defaultValue: "Response options",
                  })}
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-gray-600 text-sm">
                  <span className="flex items-center gap-1.5">
                    <VoteIcon vote="yes" />
                    {t("heroDemoYes", {
                      ns: "home",
                      defaultValue: "Yes",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <VoteIcon vote="ifNeedBe" />
                    {t("heroDemoIfNeedBe", {
                      ns: "home",
                      defaultValue: "If need be",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <VoteIcon vote="no" />
                    {t("heroDemoNo", {
                      ns: "home",
                      defaultValue: "No",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200/60 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">
                  {t("heroDemoParticipants", {
                    ns: "home",
                    defaultValue: "Participants",
                  })}
                </span>
                <span className="rounded-md border px-1.5 py-0.5 text-gray-500 text-xs">
                  {demoParticipants.length}
                </span>
                <span className="flex size-6 items-center justify-center rounded-md border text-gray-500">
                  <PlusIcon className="size-3.5" />
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-500 text-sm">
                <span>
                  {t("heroDemoOptionCount", {
                    ns: "home",
                    defaultValue:
                      "{count, plural, one {# option} other {# options}}",
                    count: optionCount,
                  })}
                </span>
                <Maximize2Icon className="size-4" />
              </div>
            </div>
            <div className="grid grid-cols-[172px_repeat(8,84px)] border-gray-100 border-t text-center lg:grid-cols-[minmax(172px,1.5fr)_repeat(8,minmax(84px,1fr))]">
              <div />
              {monthGroups.map((group) => (
                <div
                  key={group.label}
                  style={{ gridColumn: `span ${group.span}` }}
                  className="border-gray-100 border-l py-2 text-left"
                >
                  <span className="pl-3 font-medium text-gray-700 text-xs tracking-wide">
                    {group.label}
                  </span>
                </div>
              ))}
              <div />
              {days.flatMap((day) =>
                day.options.map((option, slotIndex) => (
                  <div
                    key={option.start.toISOString()}
                    className={cn(
                      "border-gray-100 border-t pt-2.5 text-gray-500 text-xs",
                      slotIndex === 0 && "border-l",
                    )}
                  >
                    {slotIndex === 0 && (
                      <>
                        {format.weekday.format(day.date)}
                        <div className="font-semibold text-base text-gray-900">
                          {format.dayOfMonth.format(day.date)}
                        </div>
                      </>
                    )}
                  </div>
                )),
              )}
              <div />
              {days.flatMap((day) =>
                day.options.map((option, slotIndex) => {
                  const optionIndex =
                    days
                      .slice(0, days.indexOf(day))
                      .reduce((sum, d) => sum + d.options.length, 0) +
                    slotIndex;
                  const score = scores[optionIndex];
                  return (
                    <div
                      key={option.start.toISOString()}
                      className={cn(
                        "space-y-1 py-2.5 text-xs",
                        slotIndex === 0
                          ? "border-gray-100 border-l"
                          : "border-gray-50 border-l",
                      )}
                    >
                      <div className="text-gray-700">
                        {format.time.format(option.start)}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-gray-500">
                        <ClockIcon className="size-3" />
                        1h
                      </div>
                      <VoteCount count={score} highlight={score === topScore} />
                    </div>
                  );
                }),
              )}
              {demoParticipants.map((participant) => (
                <React.Fragment key={participant.name}>
                  <div className="flex items-center gap-2.5 border-gray-100 border-t px-3 py-3 text-left">
                    <span className="flex size-7 items-center justify-center rounded-full bg-gray-100 font-medium text-[10px] text-gray-600 uppercase">
                      {getInitials(participant.name)}
                    </span>
                    <span className="truncate text-gray-800 text-sm">
                      {participant.name}
                    </span>
                  </div>
                  {participant.votes.map((vote, index) => (
                    <div
                      key={`${participant.name}-${index}`}
                      className={cn(
                        "flex items-center justify-center border-gray-100 border-t",
                        index % 2 === 0
                          ? "border-l"
                          : "border-gray-50 border-l",
                      )}
                    >
                      <VoteIcon vote={vote} />
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </DemoScreen>
    </DemoFrame>
  );
};
