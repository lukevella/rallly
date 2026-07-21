"use client";

import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";
import React from "react";

/**
 * Cloudflare Turnstile in interaction-only mode. Solves invisibly in the
 * background; the widget only appears when Cloudflare requires an
 * interactive challenge. While invisible, the container is removed from
 * the layout entirely so space-y/gap parents don't add a gap around it —
 * via inline style, since the library's own inline display would
 * override a class.
 */
export function Turnstile({
  ref,
  siteKey,
  language,
  onSuccess,
}: {
  ref?: React.Ref<TurnstileInstance>;
  siteKey: string;
  language: string;
  onSuccess?: (token: string) => void;
}) {
  const [isInteractive, setIsInteractive] = React.useState(false);

  return (
    <TurnstileWidget
      ref={ref}
      siteKey={siteKey}
      style={isInteractive ? undefined : { display: "none" }}
      onBeforeInteractive={() => setIsInteractive(true)}
      onAfterInteractive={() => setIsInteractive(false)}
      onSuccess={onSuccess}
      options={{
        language,
        size: "flexible",
        appearance: "interaction-only",
      }}
    />
  );
}
