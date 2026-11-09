"use client";
import { posthog } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
import * as React from "react";
import type { DemoVote } from "./demo-data";
import { VoteIcon } from "./vote-icon";

// The one piece of the phone demo that holds state: a tri-state vote control
// per option. Everything around it is server rendered.
export const VoteSelector = ({
  label,
  voteLabels,
  defaultValue,
}: {
  label: string;
  voteLabels: Record<DemoVote, string>;
  defaultValue?: DemoVote;
}) => {
  const [value, setValue] = React.useState(defaultValue);
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
