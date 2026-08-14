"use client";
import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import * as m from "motion/react-m";
import Link from "next/link";
import type React from "react";
import { handwritten } from "@/fonts/handwritten";
import { Trans } from "@/i18n/client/trans";
import { linkToApp } from "@/lib/linkToApp";

export const FinalCta = ({
  title,
  description,
  callToAction,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  callToAction?: React.ReactNode;
}) => {
  return (
    <m.div
      transition={{
        duration: 1,
        type: "spring",
        bounce: 0.3,
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onViewportEnter={() => {
        posthog.capture("landing:final_cta_view");
      }}
    >
      <section className="space-y-8 py-8 text-center sm:py-24">
        <div className="space-y-4">
          <h2 className="text-pretty font-bold text-2xl tracking-tight sm:text-4xl">
            {title ?? (
              <Trans
                ns="home"
                i18nKey="finalCtaTitle"
                defaults="Ready to find the best time to meet?"
              />
            )}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base text-gray-500 sm:text-lg">
            {description ?? (
              <Trans
                ns="home"
                i18nKey="finalCtaDescription"
                defaults="Create a poll, share the link, and let everyone vote on times that work."
              />
            )}
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Link
            href={linkToApp("/new")}
            className={buttonVariants({
              size: "xl",
              variant: "primary",
              className: "shadow-md transition-all active:shadow-none",
            })}
            onClick={() => {
              posthog.capture("landing:final_cta_click");
            }}
          >
            {callToAction ?? (
              <Trans
                ns="home"
                i18nKey="createAPoll"
                defaults="Create a meeting poll"
              />
            )}
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
      </section>
    </m.div>
  );
};
