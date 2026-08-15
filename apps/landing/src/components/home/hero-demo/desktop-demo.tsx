import { cn } from "@rallly/ui";
import type { TFunction } from "i18next";
import {
  ClockIcon,
  LockIcon,
  MapPinIcon,
  Maximize2Icon,
  PlusIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import * as React from "react";
import type { DemoDay } from "./demo-data";
import { demoParticipants, formatDemoParts, getInitials } from "./demo-data";
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
    <div className="rounded-2xl border bg-white p-2 shadow-sm">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-1 pt-0.5 pb-2">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-gray-200" />
          <span className="size-2.5 rounded-full bg-gray-200" />
          <span className="size-2.5 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-gray-500 text-xs">
          <LockIcon className="size-3 text-gray-400" />
          rallly.co/invite/mdXPow2ZbLqW
        </div>
        <div />
      </div>
      <div className="overflow-hidden rounded-lg border bg-gray-100 p-4 sm:p-6">
        <div className="mx-auto w-fit space-y-3 text-left">
          <div className="overflow-hidden rounded-xl border border-gray-200/60 bg-white">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="space-y-3 p-4 sm:p-5">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg tracking-tight">
                  {t("heroDemoTitle", {
                    ns: "home",
                    defaultValue: "Q3 Board Meeting",
                  })}
                </h3>
                <p className="mt-1 text-gray-600 text-sm">
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
                  {t("heroDemoOrganizedBy", {
                    ns: "home",
                    defaultValue: "Organized by Luke",
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
                    <VoteIcon vote="yes" className="size-4" />
                    {t("heroDemoYes", {
                      ns: "home",
                      defaultValue: "Yes",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <VoteIcon vote="ifNeedBe" className="size-4" />
                    {t("heroDemoIfNeedBe", {
                      ns: "home",
                      defaultValue: "If need be",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <VoteIcon vote="no" className="size-4" />
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
            <div className="grid grid-cols-[172px_repeat(8,84px)] border-gray-100 border-t text-center">
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
              {days.map((day) => (
                <div
                  key={day.date.toISOString()}
                  style={{ gridColumn: `span ${day.options.length}` }}
                  className="border-gray-100 border-t border-l pt-2.5 text-gray-500 text-xs"
                >
                  {format.weekday.format(day.date)}
                  <div className="font-semibold text-base text-gray-900">
                    {format.dayOfMonth.format(day.date)}
                  </div>
                </div>
              ))}
              <div className="border-gray-100 border-t" />
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
                        "space-y-1 border-gray-100 border-t py-2.5 text-xs",
                        slotIndex === 0
                          ? "border-l"
                          : "border-gray-50 border-l",
                      )}
                    >
                      <div className="text-gray-700">
                        {format.time.format(option.start)}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-gray-400">
                        <ClockIcon className="size-3" />
                        1h
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-center gap-1",
                          score === topScore
                            ? "font-medium text-gray-700"
                            : "text-gray-400",
                        )}
                      >
                        <UsersIcon className="size-3.5" />
                        {score}
                      </div>
                    </div>
                  );
                }),
              )}
              {demoParticipants.map((participant) => (
                <React.Fragment key={participant.name}>
                  <div className="flex items-center gap-2.5 border-gray-100 border-t px-3 py-3 text-left">
                    <span className="flex size-7 items-center justify-center rounded-full bg-gray-100 font-medium text-[10px] text-gray-500 uppercase">
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
                      <VoteIcon vote={vote} className="size-4" />
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
