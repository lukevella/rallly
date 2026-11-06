"use client";

import { cn } from "@rallly/ui";
import { RotateCcwIcon } from "lucide-react";
import * as React from "react";
import { createBreakpoint } from "react-use";
import { VoteSegmentedControl } from "@/features/poll/components/vote-segmented-control";
import { VoteSelector } from "@/features/poll/components/vote-selector";
import { Trans, useTranslation } from "@/i18n/client";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { DemoBar, DemoScreen } from "./demo-parts";

type Vote = "yes" | "ifNeedBe" | "no";

// The same breakpoint the poll uses to pick its desktop or mobile layout, so
// the control here is the one the viewer will meet on the poll.
const useBreakpoint = createBreakpoint({ list: 320, table: 640 });

const OPTION_COUNT = 3;

/**
 * A pretend poll with the real vote controls: a button that cycles through
 * the answers on desktop, a segmented control on mobile. Nothing is saved.
 */
export function VoteTryout({
  allowTentativeVotes,
  className,
}: {
  allowTentativeVotes: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const hydrated = useHydrated();
  const breakpoint = useBreakpoint();
  const [votes, setVotes] = React.useState<(Vote | undefined)[]>(() =>
    Array(OPTION_COUNT).fill(undefined),
  );
  // The server cannot know the viewport, so nothing that depends on it
  // renders until hydration.
  const isDesktop = hydrated && breakpoint === "table";
  const hasVotes = votes.some(Boolean);

  const optionLabel = (index: number) =>
    t("inviteHelpTryoutOption", {
      defaultValue: "Example option {number}",
      number: index + 1,
    });

  const setVote = (index: number, vote: Vote) =>
    setVotes((current) =>
      current.map((value, i) => (i === index ? vote : value)),
    );

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-2xl bg-gray-200/60 p-6 dark:bg-gray-800/60",
        className,
      )}
    >
      <p className="rounded-full bg-background px-3 py-1 font-medium text-muted-foreground text-xs shadow-xs">
        {!hydrated ? (
          <span className="invisible">&nbsp;</span>
        ) : isDesktop ? (
          <Trans
            i18nKey="inviteHelpTryoutDesktop"
            defaults="Try it: click a box to change the answer"
          />
        ) : (
          <Trans
            i18nKey="inviteHelpTryoutMobile"
            defaults="Try it: tap an answer"
          />
        )}
      </p>
      {!hydrated ? (
        <DemoScreen className="h-40 w-full max-w-72">{null}</DemoScreen>
      ) : isDesktop ? (
        // Options are columns and your answers a row, as on the poll.
        <DemoScreen className="w-full max-w-80">
          <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))]">
            <div className="border-b" />
            {votes.map((_, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed example columns
                key={index}
                aria-hidden="true"
                className="flex flex-col items-center gap-1.5 border-b border-l py-3"
              >
                <DemoBar tone="soft" className="h-1 w-5" />
                <DemoBar className="h-2 w-4" />
                <DemoBar tone="soft" className="w-8" />
              </div>
            ))}
            <div className="flex items-center px-3 py-3 font-medium text-sm">
              <Trans i18nKey="you" defaults="You" />
            </div>
            {votes.map((vote, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed example columns
                key={index}
                className="flex items-center justify-center border-l py-3"
              >
                <VoteSelector
                  value={vote}
                  optionLabel={optionLabel(index)}
                  allowTentativeVotes={allowTentativeVotes}
                  onChange={(next) => setVote(index, next as Vote)}
                />
              </div>
            ))}
          </div>
        </DemoScreen>
      ) : (
        <DemoScreen className="w-full max-w-72 divide-y">
          {votes.map((vote, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed example rows
              key={index}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <div
                aria-hidden="true"
                className="flex size-8 shrink-0 flex-col items-center justify-center gap-1 rounded-md border"
              >
                <DemoBar tone="soft" className="h-1 w-3" />
                <DemoBar className="w-4" />
              </div>
              <div aria-hidden="true" className="min-w-0 flex-1 space-y-1.5">
                <DemoBar className="w-16" />
                <DemoBar tone="soft" className="w-10" />
              </div>
              <VoteSegmentedControl
                value={vote}
                optionLabel={optionLabel(index)}
                allowTentativeVotes={allowTentativeVotes}
                onChange={(next) => setVote(index, next)}
              />
            </div>
          ))}
        </DemoScreen>
      )}
      {hasVotes ? (
        <button
          type="button"
          onClick={() => setVotes(Array(OPTION_COUNT).fill(undefined))}
          aria-label={t("inviteHelpTryoutReset", {
            defaultValue: "Clear answers",
          })}
          className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-gray-300/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring dark:hover:bg-gray-700/60"
        >
          <RotateCcwIcon className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
