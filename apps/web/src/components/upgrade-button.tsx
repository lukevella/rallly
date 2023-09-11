import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { Trans } from "next-i18next";
import React from "react";

import { usePostHog } from "@/utils/posthog";

export const UpgradeButton = ({
  children,
  annual,
}: React.PropsWithChildren<{ annual?: boolean }>) => {
  const posthog = usePostHog();

  return (
    <form method="POST" action="/api/stripe/checkout">
      <input
        type="hidden"
        name="period"
        value={annual ? "yearly" : "monthly"}
      />
      <input
        type="hidden"
        name="return_path"
        value={window.location.pathname}
      />
      <Button
        className="w-full"
        type="submit"
        variant="primary"
        onClick={() => {
          posthog?.capture("click upgrade button");
        }}
      >
        {children || <Trans i18nKey="upgrade" defaults="Upgrade" />}
      </Button>
    </form>
  );
};

export const UpgradeLink = ({}) => {
  return (
    <Button variant="primary" asChild>
      <Link href="/settings/billing">
        <Trans i18nKey="upgrade" defaults="Upgrade" />
      </Link>
    </Button>
  );
};
