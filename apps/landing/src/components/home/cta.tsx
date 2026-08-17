import { cn } from "@rallly/ui";
import type * as React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { CtaButton } from "@/components/home/cta-button";
import { FadeIn } from "@/components/home/fade-in";
import { handwritten } from "@/fonts/handwritten";
import { getTranslation } from "@/i18n/server";

export async function Cta({
  locale,
  title,
  description,
  callToAction,
}: {
  locale: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  callToAction?: React.ReactNode;
}) {
  const { t } = await getTranslation(locale, ["home"]);
  return (
    <section className="py-8 sm:py-24">
      <FadeIn captureOnEnter="landing:final_cta_view">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <h2 className="text-balance font-medium text-2xl text-gray-800 leading-tight tracking-tight sm:text-4xl">
            {title ?? (
              <Trans
                t={t}
                ns="home"
                i18nKey="finalCtaTitle"
                defaults="Ready to find the best time to meet?"
              />
            )}
          </h2>
          <p className="max-w-prose text-pretty text-gray-500 text-sm sm:text-balance sm:text-lg">
            {description ?? (
              <Trans
                t={t}
                ns="home"
                i18nKey="finalCtaDescription"
                defaults="Create a poll, share the link, and let everyone vote on times that work."
              />
            )}
          </p>
        </div>
        <div className="mt-6 flex flex-col items-start gap-4">
          <CtaButton captureEvent="landing:final_cta_click">
            {callToAction ?? (
              <Trans
                t={t}
                ns="home"
                i18nKey="createAPoll"
                defaults="Create a poll"
              />
            )}
          </CtaButton>
          <p
            className={cn(
              "whitespace-nowrap text-gray-600 text-xs",
              handwritten.className,
              "decoration underline decoration-2 decoration-gray-300 underline-offset-8",
            )}
          >
            <Trans
              t={t}
              ns="home"
              i18nKey="hint"
              defaults="It's free! No login required."
            />
          </p>
        </div>
      </FadeIn>
    </section>
  );
}
