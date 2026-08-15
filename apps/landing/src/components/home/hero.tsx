"use client";
import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { handwritten } from "@/fonts/handwritten";
import { Trans } from "@/i18n/client/trans";
import { linkToApp } from "@/lib/linkToApp";

export const MarketingHero = ({
  title,
  description,
  callToAction,
  demo,
}: {
  title: string;
  description: string;
  callToAction: React.ReactNode;
  demo: React.ReactNode;
}) => {
  return (
    <article className="max-w-full space-y-16 text-center">
      <header className="pt-6 sm:pt-28 sm:pb-8">
        <div>
          <Link
            href="/blog/mobile-voting-redesign"
            className="group relative inline-flex items-center gap-x-2 rounded-full border bg-gray-50 py-1 pr-4 pl-1 text-gray-600 text-sm leading-6 hover:bg-white"
          >
            <Badge variant="secondary">
              <Trans ns="home" i18nKey="new" defaults="New" />
            </Badge>
            <span className="flex items-center gap-x-1">
              <Trans
                ns="home"
                i18nKey="mobileVotingBlog"
                defaults="A clearer way to vote on your phone"
              />
              <ChevronRightIcon
                className="-mr-1 size-4 transition-transform group-active:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
        <h1 className="mt-6 mb-2 text-pretty font-bold text-2xl tracking-tight sm:mb-4 sm:text-5xl">
          {title}
        </h1>
        <h2 className="mx-auto max-w-3xl text-pretty font-normal text-base text-gray-500 sm:text-xl sm:leading-relaxed">
          {description}
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <Link
            href={linkToApp("/new")}
            className={buttonVariants({
              size: "xl",
              variant: "primary",
              className: "shadow-md transition-all active:shadow-none",
            })}
            onClick={() => {
              posthog.capture("landing:hero_cta_click");
            }}
          >
            {callToAction}
          </Link>
          <p
            className={cn(
              "whitespace-nowrap text-center text-gray-600 text-xs",
              handwritten.className,
              "decoration underline decoration-2 decoration-gray-300 underline-offset-8",
            )}
          >
            <Trans
              ns="home"
              i18nKey="hint"
              defaults="It's free! No login required."
            />
          </p>
        </div>
      </header>
      <section>{demo}</section>
    </article>
  );
};
