"use client";
import { useFeatureFlagVariantKey } from "@rallly/posthog/client";
import { Trans } from "@/i18n/client/trans";

export function CtaLabel() {
  const variant = useFeatureFlagVariantKey("landing-cta-copy");
  if (variant === "get-started") {
    return (
      <Trans
        ns="home"
        i18nKey="getStartedForFree"
        defaults="Get started for free"
      />
    );
  }
  return <Trans ns="home" i18nKey="createAPoll" defaults="Create a poll" />;
}
