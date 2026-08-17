"use client";
import { useFeatureFlagVariantKey } from "@rallly/posthog/client";
import React from "react";
import { Trans } from "@/i18n/client/trans";

export function CtaLabel({
  variant,
}: {
  variant?: "control" | "create-free-poll";
}) {
  const flagVariant = useFeatureFlagVariantKey("landing-cta-copy");
  // Without a server-assigned variant the static HTML says control, so the
  // flag value (which may be bootstrapped from a cookie and available on the
  // first client render) must not apply until after hydration.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const resolved = variant ?? (mounted ? flagVariant : undefined);
  if (resolved === "create-free-poll") {
    return (
      <Trans
        ns="home"
        i18nKey="createAFreePoll"
        defaults="Create a free poll"
      />
    );
  }
  return <Trans ns="home" i18nKey="createAPoll" defaults="Create a poll" />;
}
