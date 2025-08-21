"use client";

import { usePostHog } from "@rallly/posthog/client";
import { SparklesIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { PayWallButton } from "@/features/billing/client";

export function UpgradeToProAlert() {
  const posthog = usePostHog();
  return (
    <div className="relative overflow-hidden rounded-xl border bg-gray-50 p-3 text-sm shadow-sm">
      <SparklesIcon className="-top-4 absolute right-0 z-0 size-16 text-gray-200" />
      <div className="relative z-10">
        <h2 className="font-semibold">
          <Trans i18nKey="upgrade" defaults="Upgrade" />
        </h2>
        <p className="mt-1 mb-3 text-muted-foreground text-sm">
          <Trans
            i18nKey="upgradeToProDesc"
            defaults="Unlock all Pro features"
          />
        </p>
        <PayWallButton
          variant="primary"
          onClick={() => {
            posthog?.capture("space_sidebar:upgrade_button_click");
          }}
          className="w-full"
        >
          <Trans i18nKey="upgrade" defaults="Upgrade" />
        </PayWallButton>
      </div>
    </div>
  );
}
