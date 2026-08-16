"use client";
import { posthog } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
import * as React from "react";
import { useTranslation } from "@/i18n/client/use-translation";
import type { DemoVote } from "./demo-data";
import { VoteIcon } from "./vote-icon";

// The one piece of the phone demo that holds state: a tri-state vote control
// per option. Everything around it is server rendered.
export const VoteSelector = ({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue?: DemoVote;
}) => {
  const { t } = useTranslation("home");
  const [value, setValue] = React.useState(defaultValue);
  const voteLabels: Record<DemoVote, string> = {
    yes: t("heroDemoYes", { defaultValue: "Yes" }),
    ifNeedBe: t("heroDemoIfNeedBe", { defaultValue: "If need be" }),
    no: t("heroDemoNo", { defaultValue: "No" }),
  };
  return (
    <div className="flex h-8 w-24 shrink-0 items-center rounded-lg border border-gray-200/60 bg-gray-100 p-0.5">
      {(["yes", "ifNeedBe", "no"] as const).map((vote) => {
        const isSelected = vote === value;
        return (
          <label
            key={vote}
            className={cn(
              "group flex h-full flex-1 cursor-pointer items-center justify-center rounded-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500",
              isSelected && "bg-white shadow-sm",
            )}
          >
            <input
              type="radio"
              name={label}
              checked={isSelected}
              onChange={() => {
                posthog?.capture("landing:hero_demo_vote_change", { vote });
                setValue(vote);
              }}
              aria-label={voteLabels[vote]}
              className="sr-only"
            />
            <VoteIcon
              vote={vote}
              className={cn(
                !isSelected &&
                  "text-gray-400 opacity-50 transition-opacity group-hover:opacity-100",
              )}
            />
          </label>
        );
      })}
    </div>
  );
};
