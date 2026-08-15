"use client";
import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { CircleCheckIcon, UserIcon, XIcon } from "lucide-react";
import * as m from "motion/react-m";
import Link from "next/link";
import * as React from "react";
import { Trans } from "@/i18n/client/trans";
import { useTranslation } from "@/i18n/client/use-translation";
import { linkToApp } from "@/lib/linkToApp";
import type { DemoVote } from "./demo-data";
import { DemoFrame, DemoScreen } from "./demo-frame";
import { VoteCount } from "./vote-count";
import { VoteIcon } from "./vote-icon";

export type MobileDemoDay = {
  label: string;
  options: { id: string; time: string; score: number }[];
};

const initialVotes: (DemoVote | undefined)[] = ["yes", "yes", "ifNeedBe"];

const TriState = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: DemoVote;
  onChange: (vote: DemoVote) => void;
}) => {
  const { t } = useTranslation("home");
  const voteLabels: Record<DemoVote, string> = {
    yes: t("heroDemoYes", { defaultValue: "Yes" }),
    ifNeedBe: t("heroDemoIfNeedBe", { defaultValue: "If need be" }),
    no: t("heroDemoNo", { defaultValue: "No" }),
  };
  return (
    <div className="flex h-8 w-24 shrink-0 items-center gap-0.5 rounded-lg border border-gray-200/60 bg-gray-100 p-0.5">
      {(["yes", "ifNeedBe", "no"] as const).map((vote) => {
        const isSelected = vote === value;
        return (
          <label
            key={vote}
            className={cn(
              "flex h-full flex-1 cursor-pointer items-center justify-center rounded-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500",
              isSelected ? "bg-white shadow-sm" : "hover:bg-white/50",
            )}
          >
            <input
              type="radio"
              name={label}
              checked={isSelected}
              onChange={() => onChange(vote)}
              aria-label={voteLabels[vote]}
              className="sr-only"
            />
            <VoteIcon
              vote={vote}
              className={cn("size-3.5", !isSelected && "text-gray-400")}
            />
          </label>
        );
      })}
    </div>
  );
};

export const MobileDemo = ({ days }: { days: MobileDemoDay[] }) => {
  const { t } = useTranslation("home");
  const [submitted, setSubmitted] = React.useState(false);
  const topScore = Math.max(
    ...days.flatMap((day) => day.options.map((option) => option.score)),
  );
  const [votes, setVotes] = React.useState<
    Record<string, DemoVote | undefined>
  >(() => {
    const entries: Record<string, DemoVote | undefined> = {};
    days
      .flatMap((day) => day.options)
      .forEach((option, index) => {
        entries[option.id] = initialVotes[index];
      });
    return entries;
  });

  return (
    <DemoFrame className="rounded-[1.8rem]">
      <DemoScreen className="relative flex h-[620px] flex-col rounded-[1.4rem] text-left">
        <div className="flex items-center justify-between border-gray-100 border-b px-3 py-3">
          <span className="flex items-center gap-2 font-medium text-gray-900 text-sm">
            <span className="flex size-6 items-center justify-center rounded-full bg-gray-100">
              <UserIcon className="size-3.5 text-gray-500" />
            </span>
            <Trans ns="home" i18nKey="heroDemoYou" defaults="You" />
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {days.map((day) => (
            <div key={day.label}>
              <div className="border-gray-100 border-b bg-gray-50/60 px-3 py-2 font-semibold text-gray-900 text-xs">
                {day.label}
              </div>
              {day.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between gap-2 border-gray-100 border-b px-3 py-3"
                >
                  <div className="min-w-0 flex-1 text-gray-800 text-xs">
                    {option.time}
                  </div>
                  <VoteCount
                    count={option.score}
                    highlight={option.score === topScore}
                    className="mr-2 shrink-0"
                  />
                  <TriState
                    label={`${day.label} ${option.time}`}
                    value={votes[option.id]}
                    onChange={(vote) => {
                      setVotes((current) => ({
                        ...current,
                        [option.id]: vote,
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-55% from-white via-85% via-white/70 to-transparent p-3 pt-10">
          <span
            aria-hidden="true"
            className="flex-1 rounded-xl border border-white/60 bg-white/70 py-2.5 text-center font-medium text-gray-800 text-sm shadow-sm backdrop-blur-md"
          >
            <Trans ns="home" i18nKey="heroDemoDecline" defaults="Decline" />
          </span>
          <button
            type="button"
            onClick={() => {
              posthog?.capture("landing:hero_demo_continue_click");
              setSubmitted(true);
            }}
            className="flex-[2] cursor-pointer rounded-xl bg-indigo-500/90 py-2.5 text-center font-medium text-sm text-white shadow-sm backdrop-blur-md hover:bg-indigo-500"
          >
            <Trans ns="home" i18nKey="heroDemoContinue" defaults="Continue" />
          </button>
        </div>
        {submitted && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/20 p-4">
            <m.div
              initial={{ scale: 0.92, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.35 }}
              className="relative flex aspect-[4/3] w-full flex-col rounded-2xl bg-white p-4 text-center shadow-lg"
            >
              <button
                type="button"
                aria-label={t("heroDemoClose", { defaultValue: "Close" })}
                onClick={() => setSubmitted(false)}
                className="absolute top-3 right-3 flex size-6 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XIcon className="size-4" />
              </button>
              <div className="flex flex-1 flex-col items-center justify-center">
                <m.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    duration: 0.6,
                    bounce: 0.45,
                    delay: 0.1,
                  }}
                  className="mx-auto w-fit"
                >
                  <CircleCheckIcon className="size-9 text-green-500" />
                </m.div>
                <m.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    duration: 0.6,
                    bounce: 0.3,
                    delay: 0.2,
                  }}
                >
                  <div className="mt-3 font-semibold text-gray-900 text-sm">
                    <Trans
                      ns="home"
                      i18nKey="heroDemoThatWasEasy"
                      defaults="That was easy!"
                    />
                  </div>
                </m.div>
              </div>
              <m.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  duration: 0.6,
                  bounce: 0.3,
                  delay: 0.3,
                }}
              >
                <Link
                  href={linkToApp("/new")}
                  onClick={() => {
                    posthog?.capture("landing:hero_demo_modal_cta_click");
                  }}
                  className={buttonVariants()}
                >
                  <Trans
                    ns="home"
                    i18nKey="heroDemoCreatePoll"
                    defaults="Create your own poll"
                  />
                </Link>
              </m.div>
            </m.div>
          </div>
        )}
      </DemoScreen>
    </DemoFrame>
  );
};
