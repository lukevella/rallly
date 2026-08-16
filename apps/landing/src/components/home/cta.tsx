import type * as React from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { CtaButton } from "@/components/home/cta-button";
import { FadeIn } from "@/components/home/fade-in";
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
        <div className="grid gap-4 space-y-4 sm:grid-cols-2 sm:gap-6">
          <h2 className="text-balance font-medium text-4xl leading-tight tracking-tight">
            {title ?? (
              <Trans
                t={t}
                ns="home"
                i18nKey="finalCtaTitle"
                defaults="Ready to find the best time to meet?"
              />
            )}
          </h2>
          <p className="max-w-prose text-pretty text-gray-500 text-lg">
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
        <div className="mt-6">
          <CtaButton captureEvent="landing:final_cta_click">
            {callToAction ?? (
              <Trans
                t={t}
                ns="home"
                i18nKey="createAPoll"
                defaults="Create a meeting poll"
              />
            )}
          </CtaButton>
        </div>
      </FadeIn>
    </section>
  );
}
