"use client";
import { posthog } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
import { CircleCheckIcon, XIcon } from "lucide-react";
import * as m from "motion/react-m";
import Link from "next/link";
import * as React from "react";
import { Trans } from "@/i18n/client/trans";
import { useTranslation } from "@/i18n/client/use-translation";
import { linkToApp } from "@/lib/linkToApp";

// The action bar of the phone demo, plus the confirmation it opens. The
// surrounding poll layout stays on the server. Must be a direct child of the
// relative DemoScreen so the confirmation overlay covers the whole screen.
export const VoteActions = ({ accentColor }: { accentColor?: string }) => {
  const { t } = useTranslation("home");
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <>
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
          className={cn(
            "flex-[2] cursor-pointer rounded-xl py-2.5 text-center font-medium text-sm text-white shadow-sm backdrop-blur-md",
            // A branded poll recolours the primary action; otherwise it keeps
            // the Rallly accent.
            !accentColor && "bg-indigo-500/90 hover:bg-indigo-500",
          )}
          style={accentColor ? { backgroundColor: accentColor } : undefined}
        >
          <Trans ns="home" i18nKey="heroDemoVote" defaults="Vote" />
        </button>
      </div>
      {submitted && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/20 p-4">
          <m.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.35 }}
            className="relative flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/85 p-4 text-center shadow-lg backdrop-blur-xl"
          >
            <button
              type="button"
              aria-label={t("heroDemoClose", { defaultValue: "Close" })}
              onClick={() => {
                posthog?.capture("landing:hero_demo_close_click");
                setSubmitted(false);
              }}
              className="absolute top-3 right-3 flex size-6 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XIcon className="size-4" />
            </button>
            <m.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                duration: 0.6,
                bounce: 0.45,
                delay: 0.1,
              }}
              className="relative mb-3 inline-block"
            >
              <div className="absolute top-0 right-0 bottom-2 -left-1.5 origin-bottom -rotate-12 scale-95 rounded-xl bg-white opacity-75 shadow-xs ring-1 ring-gray-200 ring-inset" />
              <div className="absolute top-0 -right-1.5 bottom-2 left-0 origin-bottom rotate-12 scale-95 rounded-xl bg-white opacity-75 shadow-xs ring-1 ring-gray-200 ring-inset" />
              <div className="relative inline-flex rounded-xl bg-white p-2.5 shadow-xs ring-1 ring-gray-200 ring-inset">
                <CircleCheckIcon className="size-5 text-green-500" />
              </div>
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
              <p className="font-semibold text-gray-900 text-sm">
                <Trans
                  ns="home"
                  i18nKey="heroDemoThatWasEasy"
                  defaults="That was easy!"
                />
              </p>
              <p className="mt-1.5 text-gray-500 text-xs">
                <Trans
                  ns="home"
                  i18nKey="heroDemoEasyDescription"
                  defaults="That's all it takes to respond to a poll."
                />
              </p>
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                duration: 0.6,
                bounce: 0.3,
                delay: 0.3,
              }}
              className="mt-4"
            >
              <Link
                href={linkToApp("/new")}
                onClick={() => {
                  posthog?.capture("landing:hero_demo_modal_cta_click");
                }}
                className="font-medium text-indigo-600 text-xs hover:underline"
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
    </>
  );
};
