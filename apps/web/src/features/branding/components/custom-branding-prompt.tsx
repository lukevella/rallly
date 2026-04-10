"use client";

import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useLocalStorage } from "react-use";
import { useBilling } from "@/features/billing/client";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";

export function CustomBrandingPrompt() {
  const { t } = useTranslation();
  const { data: space } = useSpace();
  const { isFree } = useBilling();
  const posthog = usePostHog();

  const [isDismissed, setIsDismissed] = useLocalStorage(
    `custom-branding-prompt-dismissed-${space.id}`,
    false,
  );

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || isFree || space.showBranding || isDismissed) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-96 overflow-hidden rounded-xl border border-popover-border bg-popover shadow-lg">
      <div className="relative h-40">
        <Image
          loading="eager"
          src="/images/branded-poll.webp"
          alt={t("customBrandingPromptTitle", {
            defaultValue: "Custom Branding",
          })}
          fill
          sizes="384px"
          style={{
            objectFit: "cover",
            objectPosition: "top",
          }}
        />
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <p className="font-semibold text-sm">
            <Trans
              i18nKey="customBrandingPromptTitle"
              defaults="Custom Branding"
            />
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          <Trans
            i18nKey="customBrandingPromptDescription"
            defaults="You're on the Pro plan. Add your brand colors to polls and emails."
          />
        </p>
        <div className="mt-6 flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            nativeButton={false}
            render={<Link href="/settings/general" />}
            onClick={() =>
              posthog?.capture("custom_branding_prompt:setup_click")
            }
          >
            <Trans i18nKey="customBrandingPromptCta" defaults="Set Up Now" />
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              posthog?.capture("custom_branding_prompt:dismiss_click");
              setIsDismissed(true);
            }}
          >
            <Trans i18nKey="dismiss" defaults="Dismiss" />
          </Button>
        </div>
      </div>
    </div>
  );
}
